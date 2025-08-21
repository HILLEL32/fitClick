import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../css/EditProfile.css'; // ← קובץ העיצוב החדש

export default function EditProfile() {
  const [userData, setUserData] = useState({
    username: '',
    phone: '',
    gender: '',
    bodyColor: '#f5d3b3'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: userData.username,
        phone: userData.phone,
        gender: userData.gender,
        bodyColor: userData.bodyColor
      });
      setMessage('הפרופיל עודכן בהצלחה!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('שגיאה בעדכון הפרופיל.');
    }
  };

  if (loading) return <div className="text-center my-5">טוען...</div>;

  return (
    <div className="container edit-wrapper" dir="rtl">
      <h2 className="edit-heading text-center">עריכת פרופיל</h2>

      {/* מרכז רק את הטופס */}
      <div className="edit-card mx-auto">
        <form onSubmit={handleSubmit}>
          <label className="form-label">שם משתמש:</label>
          <input
            type="text"
            name="username"
            className="form-control my-2 edit-input"
            value={userData.username}
            onChange={handleChange}
            required
          />

          <label className="form-label">מספר טלפון:</label>
          <input
            type="tel"
            name="phone"
            className="form-control my-2 edit-input"
            value={userData.phone}
            onChange={handleChange}
          />

          <label className="form-label">בחרי את המגדר שלך:</label>
          <select
            name="gender"
            className="form-control edit-input"
            value={userData.gender}
            onChange={handleChange}
            required
          >
            <option value="">בחר מגדר</option>
            <option value="זכר">זכר</option>
            <option value="נקבה">נקבה</option>
            <option value="אחר">אחר / לא לציין</option>
          </select>

          <label className="form-label mt-3">בחרי את צבע גוון הגוף שלך:</label>
          <input
            type="color"
            name="bodyColor"
            className="form-control form-control-color mb-3 edit-color"
            value={userData.bodyColor}
            onChange={handleChange}
            title="בחר צבע גוף"
          />

          <button type="submit" className="btn btn-save mt-3">
            שמור שינויים
          </button>
        </form>

        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>

      <Link to="/app_home" className="btn btn-home floating-button">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
