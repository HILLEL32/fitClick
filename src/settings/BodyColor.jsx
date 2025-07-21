import React, { useState } from 'react';
import '../css/design.css';
import { Link } from 'react-router-dom';


export default function BodyColor() {
  const [selectedColor, setSelectedColor] = useState('#f5d3b3');

  const handleColorChange = (event) => {
    const color = event.target.value;
    setSelectedColor(color);
    console.log('צבע גוף שנבחר:', color);
    // כאן אפשר לשלוח ל־Firebase או localStorage לפי הצורך
  };

  return (
    <div className="container text-center mt-5">
      <h2 className="mb-4">בחרי את צבע הגוף שלך</h2>

      <input
        type="color"
        value={selectedColor}
        onChange={handleColorChange}
        className="form-control form-control-color mx-auto"
        style={{ width: '100px', height: '100px', border: 'none', cursor: 'pointer' }}
      />

      <div className="mt-4">
        <span>הצבע שבחרת:</span>
        <div
          style={{
            display: 'inline-block',
            backgroundColor: selectedColor,
            width: '50px',
            height: '50px',
            border: '2px solid #000',
            borderRadius: '50%',
            marginInlineStart: '10px',
          }}
        ></div>
        <div className="mt-2"><code>{selectedColor}</code></div>
        <Link to="/" className="btn btn-success btn-lg floating-button">
          back to home
        </Link>

      </div>
    </div>
  );
}
