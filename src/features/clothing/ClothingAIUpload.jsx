import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ClothingAIUpload() {
  const [image, setImage] = useState(null);
  const [detectedClothing, setDetectedClothing] = useState('');
  const [loading, setLoading] = useState(false);


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setDetectedClothing('');
      setLoading(true);

      // זיהוי מדומה — יוחלף בחיבור ל־AI בשלב הבא
      setTimeout(() => {
        const options = ['חולצה', 'מכנסיים', 'שמלה', 'חצאית', 'בגד לא מזוהה'];
        const random = options[Math.floor(Math.random() * options.length)];
        setDetectedClothing(random);
        setLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="container text-center mt-5">
      <h2>העלאת בגד לניתוח בינה מלאכותית</h2>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="form-control mt-4"
      />

      {image && (
        <div className="mt-4">
          <img src={image} alt="בגד שהועלה" style={{ maxWidth: '300px' }} />
        </div>
      )}

      {loading && <p className="mt-3">מזהה סוג בגד...</p>}

      {!loading && detectedClothing && (
        <p className="mt-3">
          זוהה סוג בגד: <strong>{detectedClothing}</strong>
        </p>
      )}
      <Link to="/" className="btn btn-success btn-lg floating-button">
        back to home
      </Link>

    </div>
  );
}
