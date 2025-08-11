import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';

// טבלת צבעים מתאימים
const colorCompatibility = {
  red: ['black', 'white', 'denim'],
  blue: ['white', 'gray', 'beige'],
  green: ['brown', 'white'],
  black: ['white', 'red', 'pink'],
  white: ['black', 'red', 'blue', 'everything'],
  yellow: ['navy', 'white'],
  pink: ['white', 'gray', 'beige'],
  purple: ['black', 'gray'],
  beige: ['brown', 'green'],
  gray: ['black', 'white', 'blue'],
  brown: ['beige', 'white'],
  orange: ['navy', 'white'],
};

// שלב 1: חילוץ צבע עיקרי ממחרוזת
function extractBaseColor(colorString) {
  if (!colorString) return '';
  const knownColors = ['black', 'white', 'gray', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'beige', 'brown', 'orange', 'denim'];
  const lower = colorString.toLowerCase();

  for (const color of knownColors) {
    if (lower.includes(color)) {
      return color;
    }
  }

  return ''; // לא נמצא צבע מתאים
}

// שלב 2: החזרת בגדים שמתאימים לצבע
function getMatchingClothes(baseColor, wardrobe) {
  const normalizedBase = extractBaseColor(baseColor);
  const compatibleColors = colorCompatibility[normalizedBase];

  if (!compatibleColors) {
    // fallback: בגדים בצבעים נייטרליים
    return wardrobe.filter(item =>
      ['white', 'black', 'denim'].includes(extractBaseColor(item.mainColor))
    );
  }

  return wardrobe.filter(item =>
    compatibleColors.includes(extractBaseColor(item.mainColor))
  );
}

// קומפוננטה ראשית
export default function MatchingClothes() {
  const [wardrobe, setWardrobe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('blue');

  useEffect(() => {
    const fetchClothing = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, 'clothing'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      const clothes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWardrobe(clothes);
      setLoading(false);
    };

    fetchClothing();
  }, []);

  const matches = getMatchingClothes(selectedColor, wardrobe);

  return (
    <div className="container mt-4">
      <h3>הבגדים שמתאימים לצבע: {selectedColor}</h3>

      <select
        className="form-select w-25 my-3"
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
      >
        {Object.keys(colorCompatibility).map((color) => (
          <option key={color} value={color}>{color}</option>
        ))}
      </select>

      {loading ? (
        <p>טוען את הבגדים מהארון...</p>
      ) : (
        <div className="d-flex flex-wrap gap-3 mt-3">
          {matches.map((item) => (
            <div key={item.id} style={{ textAlign: 'center' }}>
              <img src={item.imageUrl} alt={item.type} width={100} />
              <p>{item.type} - {extractBaseColor(item.mainColor)}</p>
            </div>
          ))}
          {matches.length === 0 && <p>לא נמצאו התאמות</p>}
        </div>
      )}
    </div>
  );
}
