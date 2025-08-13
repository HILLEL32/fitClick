// src/features/wardrobe/RandomClothingPicker.jsx
import React, { useMemo, useState } from 'react';

export default function MatchingClothes({ clothingItems, onSelectShirt, onSelectPants }) {
  const [message, setMessage] = useState('');

  const matchByKeywords = (item, keywords) => {
    const types = (item?.type || []).map((t) => String(t).toLowerCase());
    return types.some((t) => keywords.some((k) => t.includes(k)));
  };

  const isShirt = (item) =>
    matchByKeywords(item, [
      'shirt','t-shirt','tee','top','blouse','button-down','henley','polo','jersey',
      'overshirt','camisole','tank','chemise','crewneck','v-neck',
      'חולצה','טישירט','טי-שירט','טופ'
    ]);

  const isJeans = (item) =>
    matchByKeywords(item, [
      'jeans','denim','ג׳ינס','גינס'
    ]);

  const shirts = useMemo(() => clothingItems.filter(isShirt), [clothingItems]);
  const jeans  = useMemo(() => clothingItems.filter(isJeans), [clothingItems]);

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // כלל ההתאמה: כל צבע חולצה מתאים למכנס ג'ינס
  const handlePickMatchingPair = () => {
    if (!jeans.length) {
      setMessage('לא נמצאו מכנסי ג׳ינס בארון.');
      return;
    }
    if (!shirts.length) {
      setMessage('לא נמצאו חולצות בארון.');
      return;
    }
    setMessage('');
    const chosenPants = pickRandom(jeans);
    const chosenShirt = pickRandom(shirts);
    onSelectPants?.(chosenPants);
    onSelectShirt?.(chosenShirt);
  };

  return (
    <div className="d-flex gap-2 justify-content-center mb-4 flex-wrap">
      <button className="btn btn-primary" onClick={handlePickMatchingPair}>
        לבוש יום יומי
      </button>
      {message && <div className="w-100 text-center text-danger mt-2">{message}</div>}
    </div>
  );
}
