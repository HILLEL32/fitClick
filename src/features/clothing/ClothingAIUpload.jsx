import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from "../../firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import '../../css/ClothingAIUpload.css';

const API_KEY = "0eb14ea8c68d4baa1348ee3e9969f5693be9518b0befae4b81acfc717513cb98"; // אל תחשפי מפתח — עדיף .env

export default function ClothingAIUpload() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [typedText, setTypedText] = useState("");
  const fullText = "העלה/י תמונה ברורה של הפריט, ותוך רגעים המערכת תזהה סוג, צבעים וסגנון — ותוסיף אותו לארון שלך.";
  const idxRef = useRef(0);

  useEffect(() => {
    setTypedText("");         // אתחול נקי
    idxRef.current = 0;

    const interval = setInterval(() => {
      const i = idxRef.current;
      if (i < fullText.length) {
        // לא מצרפים ל־state הקודם—פשוט חותכים את הטקסט עד האינדקס
        setTypedText(fullText.slice(0, i + 1));
        idxRef.current = i + 1;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
    // שים לב: אין תלותים—רצים פעם אחת בלבד
  }, []);


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const uploadToLykdat = async () => {
    if (!imageFile) return alert('בחרי תמונה קודם');
    setLoading(true);
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await axios.post(
        'https://cloudapi.lykdat.com/v1/detection/tags',
        formData,
        { headers: { 'x-api-key': API_KEY, 'Content-Type': 'multipart/form-data' } }
      );

      const data = response.data.data || {};
      const labels = data.labels || [];
      const items = data.items || [];
      const colors = data.colors || [];

      const extractLabels = (cat) =>
        labels.filter(l => l.classification === cat).map(l => l.name);

      const simplified = {
        type: [...new Set(items.filter(i => i.confidence > 0.6).map(i => i.name))],
        colors: colors.filter(c => c.confidence > 0.2).map(c => c.name),
        style: [...extractLabels("silhouette"), ...extractLabels("textile pattern")],
        details: [...extractLabels("garment parts"), ...extractLabels("opening type"), ...extractLabels("nickname")],
        length: extractLabels("length"),
        waistline: extractLabels("waistline")
      };

      setResult(simplified);
      await saveClothingLocallyAndToFirestore(imageFile, simplified);
    } catch (e) {
      console.error("API Error:", e);
      alert("אירעה שגיאה בזיהוי הבגד");
    } finally {
      setLoading(false);
    }
  };

  const saveClothingLocallyAndToFirestore = async (imageFile, metadata) => {
    const user = auth.currentUser;
    if (!user) return alert("המשתמש לא מחובר");

    const reader = new FileReader();
    const imageId = `img-${Date.now()}`;
    reader.onloadend = async () => {
      localStorage.setItem(imageId, reader.result);
      const clothingDoc = {
        uid: user.uid,
        imageId,
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
    <div className="aiu-page" dir="rtl">
      {/* שכבות רקע */}
      <div className="aiu-overlay" />
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />

      <header className="container-xl aiu-hero">
        <h1 className="aiu-heading">העלאת בגד לזיהוי</h1>

        <p className="aiu-sub">{typedText}</p>
      </header>

      <main className="container-xl">
        <section className="aiu-card glass-card">
          <label className="form-label aiu-label">בחרי תמונה</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="form-control fc-input aiu-input"
          />

          {previewUrl && (
            <div className="aiu-preview">
              <img src={previewUrl} alt="תצוגת תמונה" className="aiu-preview-img" />
            </div>
          )}

          <div className="aiu-actions">
            <button
              className="btn btn-auth-primary"
              onClick={uploadToLykdat}
              disabled={loading || !imageFile}
            >
              {loading ? 'מזהה…' : 'זהה את הבגד'}
            </button>
            <Link to="/wardrobe" className="btn btn-ghost">מעבר לארון שלי</Link>
          </div>

          {result && (
            <div className="aiu-result">
              <h3 className="aiu-result-title">תוצאות זיהוי</h3>
              <ul className="aiu-list">
                <li><strong>Type:</strong> {result.type.join(', ') || '—'}</li>
                <li><strong>Colors:</strong> {result.colors.join(', ') || '—'}</li>
                <li><strong>Style:</strong> {result.style.join(', ') || '—'}</li>
                <li><strong>Details:</strong> {result.details.join(', ') || '—'}</li>
                <li><strong>Length:</strong> {result.length.join(', ') || '—'}</li>
                <li><strong>Waistline:</strong> {result.waistline.join(', ') || '—'}</li>
              </ul>
            </div>
          )}
        </section>
      </main>

      <footer className="container-xl">
        <Link to="/app_home" className="btn floating-button">חזרה לדף הבית</Link>
      </footer>
    </div>
  );
}
