import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from "../../firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import '../../css/ClothingAIUpload.css'; // ← קובץ העיצוב החדש

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
      localStorage.setItem(imageId, reader.result);

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

    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="container aiu-wrapper text-center mt-5" dir="rtl">
      <h2 className="aiu-heading mb-4 text-center">העלאת בגד לזיהוי</h2>

      <div className="aiu-card mx-auto">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="form-control aiu-input"
        />

        {previewUrl && (
          <div className="aiu-preview">
            <img src={previewUrl} alt="תצוגת תמונה" className="aiu-preview-img" />
          </div>
        )}

        <button
          className="btn aiu-btn mt-3"
          onClick={uploadToLykdat}
          disabled={loading || !imageFile}
        >
          {loading ? 'מזהה...' : 'זהה את הבגד'}
        </button>

        {result && (
          <div className="aiu-result mt-4 text-start">
            <h4 className="aiu-result-title">תוצאות זיהוי</h4>
            <ul className="list-group aiu-list">
              <li className="list-group-item aiu-item"><strong>Type:</strong> {result.type.join(', ')}</li>
              <li className="list-group-item aiu-item"><strong>Colors:</strong> {result.colors.join(', ')}</li>
              <li className="list-group-item aiu-item"><strong>Style:</strong> {result.style.join(', ')}</li>
              <li className="list-group-item aiu-item"><strong>Details:</strong> {result.details.join(', ')}</li>
              <li className="list-group-item aiu-item"><strong>Length:</strong> {result.length.join(', ')}</li>
              <li className="list-group-item aiu-item"><strong>Waistline:</strong> {result.waistline.join(', ')}</li>
            </ul>
          </div>
        )}

        <div className="aiu-actions">
          <Link to="/wardrobe" className="btn aiu-link-outline mt-3">מעבר לארון שלי</Link>
        </div>
      </div>

      <Link to="/app_home" className="btn btn-home floating-button">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
