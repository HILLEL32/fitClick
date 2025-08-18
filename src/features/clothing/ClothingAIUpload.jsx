import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from "../../firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const API_KEY = "0eb14ea8c68d4baa1348ee3e9969f5693be9518b0befae4b81acfc717513cb98";

export default function ClothingAIUpload() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const uploadToLykdat = async () => {
    if (!imageFile) {
      alert('בחרי תמונה קודם');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await axios.post(
        'https://cloudapi.lykdat.com/v1/detection/tags',
        formData,
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const data = response.data.data;
      const labels = data.labels || [];
      const items = data.items || [];
      const colors = data.colors || [];

      const extractLabels = (category) =>
        labels
          .filter((label) => label.classification === category)
          .map((label) => label.name);

      const simplified = {
        type: [...new Set(items.filter(i => i.confidence > 0.6).map(i => i.name))],
        colors: colors.filter(c => c.confidence > 0.2).map(c => c.name),
        style: [...extractLabels("silhouette"), ...extractLabels("textile pattern")],
        details: [
          ...extractLabels("garment parts"),
          ...extractLabels("opening type"),
          ...extractLabels("nickname")
        ],
        length: extractLabels("length"),
        waistline: extractLabels("waistline")
      };

      setResult(simplified);
      await saveClothingLocallyAndToFirestore(imageFile, simplified);
    } catch (error) {
      console.error("API Error:", error);
      alert("אירעה שגיאה בזיהוי הבגד");
    } finally {
      setLoading(false);
    }
  };

  const saveClothingLocallyAndToFirestore = async (imageFile, metadata) => {
    const user = auth.currentUser;
    if (!user) {
      alert("המשתמש לא מחובר");
      return;
    }

    const reader = new FileReader();
    const imageId = `img-${Date.now()}`;

    reader.onloadend = async () => {
      localStorage.setItem(imageId, reader.result); // שמירה ב־localStorage

      const clothingDoc = {
        uid: user.uid,
        imageId: imageId,
        type: metadata.type || ["בגד לא מזוהה"],
        colors: metadata.colors || [],
        style: metadata.style || [],
        details: metadata.details || [],
        length: metadata.length || [],
        waistline: metadata.waistline || [],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "clothingItems"), clothingDoc);
      alert("הבגד נוסף לארון שלך (התמונה שמורה מקומית בלבד)");
    };

    reader.readAsDataURL(imageFile); // ממיר ל־Base64
  };

  return (
    <div className="container text-center mt-5">
      <h2 className="mb-4 text-center">העלאת בגד לזיהוי </h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="form-control mt-3"
      />

      {previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt="תצוגת תמונה"
            style={{ maxWidth: '300px', borderRadius: '10px' }}
          />
        </div>
      )}

      <button
        className="btn btn-success mt-3"
        onClick={uploadToLykdat}
        disabled={loading || !imageFile}
      >
        {loading ? 'מזהה...' : 'זהה את הבגד'}
      </button>

      {result && (
        <div className="mt-5 text-start">
          <h4>result</h4>
          <ul className="list-group">
            <li className="list-group-item"><strong>Type:</strong> {result.type.join(', ')}</li>
            <li className="list-group-item"><strong>Colors:</strong> {result.colors.join(', ')}</li>
            <li className="list-group-item"><strong>Style:</strong> {result.style.join(', ')}</li>
            <li className="list-group-item"><strong>Details:</strong> {result.details.join(', ')}</li>
            <li className="list-group-item"><strong>Length:</strong> {result.length.join(', ')}</li>
            <li className="list-group-item"><strong>Waistline:</strong> {result.waistline.join(', ')}</li>
          </ul>
        </div>
      )}

      <Link to="/wardrobe" className="btn btn-outline-warning mt-3">
        מעבר לארון שלי
      </Link>

      <Link to="/app_home" className="btn btn-success btn-lg floating-button">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
