// src/features/wardrobe/RandomClothingPicker.jsx
import React, { useMemo, useState } from 'react';

export default function MatchingClothes({ clothingItems, onSelectShirt, onSelectPants }) {
  const [message, setMessage] = useState('');

  // Helpers
  const toArray = (v) => Array.isArray(v) ? v : [v].filter(Boolean);
  const getTokens = (item) =>
    [...toArray(item?.type), ...toArray(item?.style), ...toArray(item?.tags)]
      .filter(Boolean)
      .map((t) => String(t).toLowerCase());

  const matchByKeywords = (item, keywords) => {
    const tokens = getTokens(item);
    return tokens.some((t) => keywords.some((k) => t.includes(k)));
  };

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // === Casual (jeans + any shirt) ===
  const isShirt = (item) =>
    matchByKeywords(item, [
      'shirt','t-shirt','tee','top','blouse','button-down','henley','polo','jersey',
      'overshirt','camisole','tank','chemise','crewneck','v-neck',
      'חולצה','טישירט','טי-שירט','טופ','מכופתרת'
    ]);
  const isJeans = (item) => matchByKeywords(item, ['jeans','denim','ג׳ינס','גינס']);

  const shirts = useMemo(() => clothingItems.filter(isShirt), [clothingItems]);
  const jeans  = useMemo(() => clothingItems.filter(isJeans), [clothingItems]);

  const handlePickMatchingPair = () => {
    if (!jeans.length) return setMessage('לא נמצאו מכנסי ג׳ינס בארון.');
    if (!shirts.length) return setMessage('לא נמצאו חולצות בארון.');
    setMessage('');
    onSelectPants?.(pickRandom(jeans));
    onSelectShirt?.(pickRandom(shirts));
  };

  // === Elegant (no jeans) ===
  const isElegantPants = (item) =>
    matchByKeywords(item, [
      'trousers','slacks','dress pants','tailored pants','suit pants','elegant',
      'מכנס מחויט','מכנס מחוייט','מכנסי בד','מכנס אלגנט','מכנס חליפה'
    ]);
  const isSkirt = (item) =>
    matchByKeywords(item, [
      'skirt','pencil skirt','midi skirt','maxi skirt',
      'חצאית','עיפרון','מידי','מקסי'
    ]);
  const isElegantTop = (item) =>
    matchByKeywords(item, [
      'blouse','button-down','silk','satin','camisole','top',
      'חולצה אלגנטית','מכופתרת','משי','סאטן','טופ אלגנטי'
    ]);

  const elegantBottoms = useMemo(
    () => clothingItems.filter((it) => (isElegantPants(it) || isSkirt(it)) && !isJeans(it)),
    [clothingItems]
  );
  const elegantTops = useMemo(
    () => clothingItems.filter(isElegantTop),
    [clothingItems]
  );

  const handlePickElegantPair = () => {
    if (!elegantBottoms.length) return setMessage('לא נמצאו מכנסיים מחוייטים או חצאיות בארון.');
    if (!elegantTops.length) return setMessage('לא נמצאו חולצות אלגנטיות בארון.');
    setMessage('');
    onSelectPants?.(pickRandom(elegantBottoms));
    onSelectShirt?.(pickRandom(elegantTops));
  };

  // === Occasion (Shabbat/Holiday/Event) ===
  // 1) Prefer a dress; 2) fallback to elegant top + occasion bottom
  const isDress = (item) =>
    matchByKeywords(item, [
      'dress','evening dress','cocktail dress','midi dress','maxi dress','wrap dress','sheath dress',
      'שמלה','שמלת ערב','שמלת קוקטייל','שמלת מידי','שמלת מקסי','שמלה אלגנטית','שמלת מעטפת','שמלת עיפרון'
    ]) && !isJeans(item); // אל תמנעי בדים דמויי-דנים אם לא ג׳ינס אמיתי

  const isOccasionBottom = (item) =>
    matchByKeywords(item, [
      'dress pants','tailored pants','suit pants','pleated pants','wide leg',
      'מכנס מחויט','מכנס מחוייט','מכנס חליפה','מכנסי בד','מחוייטות',
      'pencil skirt','a-line skirt','pleated skirt','midi skirt','maxi skirt',
      'חצאית עיפרון','חצאית a-line','חצאית פליסה','חצאית מידי','חצאית מקסי','חצאית אלגנטית'
    ]) && !isJeans(item);

  const isOccasionTop = (item) =>
    matchByKeywords(item, [
      'silk','satin','chiffon','lace','organza','שיפון','תחרה','משי','סאטן','אורגנזה',
      'blouse','dressy top','button-down','מכופתרת','חולצה אלגנטית','טופ אלגנטי'
    ]);

  const dresses = useMemo(() => clothingItems.filter(isDress), [clothingItems]);
  const occasionBottoms = useMemo(() => clothingItems.filter(isOccasionBottom), [clothingItems]);
  const occasionTops = useMemo(() => clothingItems.filter(isOccasionTop), [clothingItems]);

  const handlePickOccasionPair = () => {
    // Try a dress first
    if (dresses.length) {
      setMessage('');
      const chosenDress = pickRandom(dresses);
      onSelectShirt?.(chosenDress);   // מציגים את השמלה כ"עליונית" לבחירה
      onSelectPants?.(null);          // אין תחתון — ההורה צריך לתמוך ב-null
      return;
    }
    // Fallback to top + bottom
    if (!occasionBottoms.length) return setMessage('לא נמצאו תחתונים מתאימים לשבת/חג/אירוע.');
    if (!occasionTops.length) return setMessage('לא נמצאו עליוניות חגיגיות לשבת/חג/אירוע.');
    setMessage('');
    onSelectPants?.(pickRandom(occasionBottoms));
    onSelectShirt?.(pickRandom(occasionTops));
  };

  return (
    <div className="d-flex gap-2 justify-content-center mb-4 flex-wrap">
      <button className="btn btn-primary" onClick={handlePickMatchingPair}>
        לבוש יום יומי
      </button>
      <button className="btn btn-outline-dark" onClick={handlePickElegantPair}>
        לבוש אלגנטי
      </button>
      <button className="btn btn-warning" onClick={handlePickOccasionPair}>
        לשבת/חג/אירוע
      </button>
      {message && <div className="w-100 text-center text-danger mt-2">{message}</div>}
    </div>
  );
}
