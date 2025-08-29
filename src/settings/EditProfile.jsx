import { useRef } from 'react';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../css/EditProfile.css';

export default function EditProfile() {
  const [userData, setUserData] = useState({
    username: '',
    phone: '',
    gender: '',
    bodyColor: '#f5d3b3'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const fullText = "עדכני/ן כאן את הפרטים האישיים שלך.";
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

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setUserData(userSnap.data());
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

  if (loading) {
    return (
      <div className="edit-page" dir="rtl">
        <div className="edit-overlay" />
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        <div className="glass-card edit-loader">טוען…</div>
      </div>
    );
  }

  return (
    <div className="edit-page" dir="rtl">
      {/* שכבת טקסטורה ועדינות */}
      <div className="edit-overlay" />
      {/* דקורציות blobs */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      <header className="edit-hero container-xl">
        <h1 className="edit-heading">עריכת פרופיל</h1>

        <p className="edit-sub">{typedText}</p>

      </header>

      <main className="container-xl">
        <section className="glass-card edit-card">
          <form onSubmit={handleSubmit} className="edit-form">
            <label className="form-label edit-label">שם משתמש</label>
            <input
              type="text"
              name="username"
              className="form-control fc-input"
              value={userData.username}
              onChange={handleChange}
              required
            />

            <label className="form-label edit-label">מספר טלפון</label>
            <input
              type="tel"
              name="phone"
              className="form-control fc-input"
              value={userData.phone}
              onChange={handleChange}
            />

            <label className="form-label edit-label">מגדר</label>
            <select
              name="gender"
              className="form-control fc-input"
              value={userData.gender}
              onChange={handleChange}
              required
            >
              <option value="">בחר מגדר</option>
              <option value="זכר">זכר</option>
              <option value="נקבה">נקבה</option>
              <option value="אחר">אחר / לא לציין</option>
            </select>
            {/* 
            <label className="form-label edit-label">גוון עור</label>
            <div className="color-row">
              <input
                type="color"
                name="bodyColor"
                className="form-control form-control-color fc-color"
                value={userData.bodyColor}
                onChange={handleChange}
                title="בחר צבע גוף"
              />
              <span
                className="bodycolor-swatch"
                style={{ backgroundColor: userData.bodyColor || '#eee' }}
                title={userData.bodyColor || ''}
              />
              <code className="color-code">{userData.bodyColor}</code>
            </div> */}

            <div className="actions">
              <button type="submit" className="btn btn-auth-primary">שמור שינויים</button>
              <Link to="/user_profile" className="btn btn-ghost">ביטול</Link>
            </div>
          </form>

          {message && <div className="alert alert-info mt-2">{message}</div>}
        </section>
      </main>

      <footer className="container-xl">
        <Link to="/app_home" className="btn floating-button">חזרה לדף הבית</Link>
      </footer>
    </div>
  );
}
