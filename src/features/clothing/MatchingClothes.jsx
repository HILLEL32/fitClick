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

  // ===== Color helpers =====
  const KNOWN_COLORS = {
    black: ['black','שחור'],
    white: ['white','לבן'],
    gray: ['gray','grey','אפור'],
    blue: ['blue','כחול'],
    lightblue: ['light blue','sky blue','תכלת'],
    navy: ['navy','נייבי','כחול כהה'],
    red: ['red','אדום','בורדו','burgundy','maroon'],
    green: ['green','ירוק'],
    yellow: ['yellow','צהוב','חרדל','mustard'],
    pink: ['pink','ורוד'],
    purple: ['purple','סגול','lilac','lavender'],
    beige: ['beige','בז','בז\''],
    brown: ['brown','חום','tan','camel'],
    orange: ['orange','כתום'],
    denim: ['denim','דנים','ג׳ינס','גינס'],
  };

  const NEUTRALS = new Set(['black','white','gray','beige','denim','brown','navy']);

  const COLOR_COMPATIBILITY = {
    black: 'all',
    white: 'all',
    gray: 'all',
    beige: 'all',
    denim: 'all',
    brown: ['white','beige','blue','lightblue','denim','pink','green','black'],
    navy: 'all',
    blue: ['white','beige','brown','gray','pink','yellow','orange','denim','navy','lightblue','black'],
    lightblue: ['white','beige','brown','navy','denim','black','blue'],
    red: ['white','black','denim','beige','navy','pink'],
    green: ['white','black','beige','brown','denim','pink'],
    yellow: ['white','black','navy','blue','denim','brown'],
    pink: ['white','black','gray','navy','denim','brown','blue','green','purple'],
    purple: ['white','black','gray','pink','navy','denim'],
    orange: ['white','black','navy','blue','denim','brown'],
  };

  const resolveBaseColor = (text) => {
    if (!text) return '';
    const lower = String(text).toLowerCase();
    for (const [base, aliases] of Object.entries(KNOWN_COLORS)) {
      if (aliases.some(a => lower.includes(a))) return base;
    }
    return '';
  };

  // ננסה קודם משדה item.color, ואם לא — מהטוקנים (type/style/tags)
  const getItemBaseColor = (item) => {
    const direct = resolveBaseColor(item?.color);
    if (direct) return direct;
    const tokens = getTokens(item);
    for (const tok of tokens) {
      const c = resolveBaseColor(tok);
      if (c) return c;
    }
    return '';
  };

  // כללי התאמת צבעים בסיסיים
  const isColorMatch = (top, bottom) => {
    const cTop = getItemBaseColor(top);
    const cBot = getItemBaseColor(bottom);
    if (!cTop || !cBot) return true;         // אם אין מידע — לא חוסמים
    if (cTop === cBot) return true;          // מונוכרום
    if (NEUTRALS.has(cTop) || NEUTRALS.has(cBot)) return true; // ניטרליים הולכים עם הכול
    const rule = COLOR_COMPATIBILITY[cTop];
    if (!rule) return false;
    if (rule === 'all') return true;
    return rule.includes(cBot);
  };

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
    if (!jeans.length)  return setMessage('לא נמצאו מכנסי ג׳ינס בארון.');
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
    if (!elegantTops.length)    return setMessage('לא נמצאו חולצות אלגנטיות בארון.');
    setMessage('');
    onSelectPants?.(pickRandom(elegantBottoms));
    onSelectShirt?.(pickRandom(elegantTops));
  };

  // === Occasion (Shabbat/Holiday/Event) ===
  const isDress = (item) =>
    matchByKeywords(item, [
      'dress','evening dress','cocktail dress','midi dress','maxi dress','wrap dress','sheath dress',
      'שמלה','שמלת ערב','שמלת קוקטייל','שמלת מידי','שמלת מקסי','שמלה אלגנטית','שמלת מעטפת','שמלת עיפרון'
    ]) && !isJeans(item);

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
    if (dresses.length) {
      setMessage('');
      const chosenDress = pickRandom(dresses);
      onSelectShirt?.(chosenDress);
      onSelectPants?.(null);
      return;
    }
    if (!occasionBottoms.length) return setMessage('לא נמצאו תחתונים מתאימים לשבת/חג/אירוע.');
    if (!occasionTops.length)    return setMessage('לא נמצאו עליוניות חגיגיות לשבת/חג/אירוע.');
    setMessage('');
    onSelectPants?.(pickRandom(occasionBottoms));
    onSelectShirt?.(pickRandom(occasionTops));
  };

  // === Sport (STRICT + Color-aware) ===
  // פריט ייחשב לספורטיבי רק אם יש לו סגנון/תגיות ספורט וגם קטגוריית טופ/בוטום מתאימה
  const hasSportStyle = (item) =>
    matchByKeywords(item, [
      'sport','sports','athletic','athleisure','gym','workout','training','active',
      'running','run','jogging','fitness','yoga','pilates','cycling','tennis','basketball','soccer','football','swim',
      'dri-fit','dry fit','quick dry','breathable','mesh','stretch','polyester','spandex',
      'ספורט','אימון','חדר כושר','ריצה','אתלטי','נושם','דריי פיט','דריפיט','בד נושם','אלסטי'
    ]);

  const isTopCategory = (item) =>
    matchByKeywords(item, [
      't-shirt','tee','top','tank','singlet','jersey','polo','hoodie','sweatshirt',
      'sports bra','bra',
      'חולצה','טישירט','טי-שירט','טופ','קפוצ׳ון','סווטשירט','חזיית ספורט'
    ]);

  const isBottomCategory = (item) =>
    matchByKeywords(item, [
      'leggings','tights','joggers','track pants','sweatpants','yoga pants',
      'running shorts','athletic shorts','shorts','skort','compression',
      'טייץ','ג׳וגרים','טרנינג','מכנס ריצה','שורט','שורטים','סקורט'
    ]);

  const isSportTop = (item) => hasSportStyle(item) && isTopCategory(item);
  const isSportBottom = (item) => hasSportStyle(item) && isBottomCategory(item);

  const sportTops = useMemo(() => clothingItems.filter(isSportTop), [clothingItems]);
  const sportBottoms = useMemo(() => clothingItems.filter(isSportBottom), [clothingItems]);

  const handlePickSportPair = () => {
    if (!sportTops.length && !sportBottoms.length)
      return setMessage('לא נמצאו פריטי ספורט בארון (צריך תגיות/סגנון ספורט + קטגוריה מתאימה).');
    if (!sportTops.length)
      return setMessage('לא נמצאו טופי ספורט. הוסיפי/ו "sport", "gym", "running" או "דריי פיט".');
    if (!sportBottoms.length)
      return setMessage('לא נמצאו תחתוני ספורט. הוסיפי/ו "running shorts", "leggings", "joggers".');

    // סינון לפי התאמת צבעים
    const compatiblePairs = [];
    for (const top of sportTops) {
      for (const bottom of sportBottoms) {
        if (isColorMatch(top, bottom)) compatiblePairs.push([top, bottom]);
      }
    }
    if (!compatiblePairs.length) {
      return setMessage('נמצאו פריטי ספורט אך בלי התאמת צבע. נסו להוסיף תגיות צבע (black/navy/blue/תכלת וכו\').');
    }

    const [top, bottom] = pickRandom(compatiblePairs);
    onSelectPants?.(bottom);
    onSelectShirt?.(top);
    setMessage('סט ספורט תואם־צבע נבחר! 💪');
  };

  return (
    <div className="d-flex gap-2 justify-content-center mb-4 flex-wrap">
      <button className="btn btn-outline-primary" onClick={handlePickMatchingPair}>
        לבוש יום יומי
      </button>
      <button className="btn btn-outline-dark" onClick={handlePickElegantPair}>
        לבוש אלגנטי
      </button>
      <button className="btn btn-outline-warning" onClick={handlePickOccasionPair}>
        לשבת/חג/אירוע
      </button>
      <button
        className="btn btn-outline-danger"
        title="שילוב לאימון/ריצה/חדר כושר"
        onClick={handlePickSportPair}
      >
        לבוש ספורט
      </button>

      {message && <div className="w-100 text-center text-danger mt-2">{message}</div>}
    </div>
  );
}
