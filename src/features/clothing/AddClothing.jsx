// לא בשימוש!!!!!!!!!!!!!!!!!!!!!!!!-----
import React, { useState } from 'react';
import { Link } from 'react-router-dom';


export default function AddClothing() {
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [detectionResult, setDetectionResult] = useState(null);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImageFile(file);
//       setImagePreview(URL.createObjectURL(file));
//       setDetectionResult(null); // ננקה תוצאה קודמת
//     }
//   };

//   const simulateAI = () => {
//     if (!imageFile) {
//       alert('בחרי קודם תמונה!');
//       return;
//     }

//     // כאן אנחנו מדמים תגובת AI לפי שם הקובץ
//     const fileName = imageFile.name.toLowerCase();

//     let type = 'בגד לא מזוהה';
//     if (fileName.includes('shirt') || fileName.includes('חולצה')) {
//       type = 'חולצה';
//     } else if (fileName.includes('dress') || fileName.includes('שמלה')) {
//       type = 'שמלה';
//     } else if (fileName.includes('pants') || fileName.includes('מכנס')) {
//       type = 'מכנסיים';
//     } else if (fileName.includes('skirt') || fileName.includes('חצאית')) {
//       type = 'חצאית';
//     }

//     setDetectionResult(`זוהה סוג בגד: ${type}`);
//   };

  return (
    <div className="container text-center mt-5">
      <h2 className="mb-4">העלאת בגד חדש</h2>
      <h2 className="mb-4">There's nothing here... 😕</h2>
      <h6>try in page "AI garment inspection"</h6>
{/* 
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
      />

      {imagePreview && (
        <div className="mt-3">
          <img
            src={imagePreview}
            alt="תצוגת בגד"
            style={{ width: '200px', borderRadius: '10px' }}
          />
        </div>
      )}

      <button className="btn btn-secondary mt-3" onClick={simulateAI}>
        זהה סוג בגד
      </button>

      {detectionResult && (
        <p className="mt-3 fw-bold text-info">{detectionResult}</p>
      )}
        */}
      <Link to="/app_home" className="btn btn-success btn-lg floating-button">
        back to home
        </Link> 

    </div>
  );
}

