import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../firebase/firebase";
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
      await saveClothingToFirebase(imageFile, simplified);
    } catch (error) {
      console.error("API Error:", error);
      alert("אירעה שגיאה בזיהוי הבגד");
    } finally {
      setLoading(false);
    }
  };

  const saveClothingToFirebase = async (imageFile, metadata) => {
    const user = auth.currentUser;
    if (!user) {
      alert("המשתמש לא מחובר");
      return;
    }

    const imageRef = ref(storage, `clothingImages/${user.uid}/${imageFile.name}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    const clothingDoc = {
      uid: user.uid,
      imageUrl: downloadURL,
      type: metadata.type || [],
      colors: metadata.colors || [],
      style: metadata.style || [],
      details: metadata.details || [],
      length: metadata.length || [],
      waistline: metadata.waistline || [],
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "clothing"), clothingDoc);
    alert("הבגד נוסף לארון!");
  };

  return (
    <div className="container text-center mt-5">
      <h2>העלאת בגד לניתוח בינה מלאכותית</h2>

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

            <li className="list-group-item">
              <strong>Type:</strong> {result.type.length > 0 ? result.type.join(', ') : 'Not detected'}
            </li>

            <li className="list-group-item">
              <strong>Colors:</strong> {result.colors.length > 0 ? result.colors.join(', ') : 'None'}
            </li>

            <li className="list-group-item">
              <strong>Style:</strong> {result.style.length > 0 ? result.style.join(', ') : 'None'}
            </li>

            <li className="list-group-item">
              <strong>Details:</strong> {result.details.length > 0 ? result.details.join(', ') : 'None'}
            </li>

            <li className="list-group-item">
              <strong>Length:</strong> {result.length.length > 0 ? result.length.join(', ') : 'None'}
            </li>

            <li className="list-group-item">
              <strong>Waistline:</strong> {result.waistline.length > 0 ? result.waistline.join(', ') : 'None'}
            </li>

          </ul>
        </div>
      )}

      <Link to="/wardrobe" className="btn btn-outline-primary mt-4">
        מעבר לארון שלי
      </Link>
    </div>
  );
}
