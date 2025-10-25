// src/pages/UserProfile.jsx
import { useRef } from 'react';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../css/UserProfile.css';
import MyStyle from './MyStyle';


export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const fullText = "כאן תמצא/י את נתוני החשבון שלך והעדפות הסגנון ששמרת.";
  const idxRef = useRef(0);

  useEffect(() => {
    setTypedText("");
    idxRef.current = 0;

    const interval = setInterval(() => {
      const i = idxRef.current;
      if (i < fullText.length) {
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
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  if (loading)
    return (
      <div className="profile-page" dir="rtl">
        <div className="profile-overlay" />
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        <div className="glass-card profile-loader">טוען פרופיל…</div>
      </div>
    );

  if (!userData)
    return (
      <div className="profile-page" dir="rtl">
        <div className="profile-overlay" />
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        <div className="glass-card profile-error">לא נמצא משתמש מחובר.</div>
      </div>
    );

  return (
    <div className="profile-page" dir="rtl">
      {/* שכבת טקסטורה ועדינות */}
      <div className="profile-overlay" />
      {/* דקורציות בלובס */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      <header className="profile-hero container-xl">
        <h1 className="profile-heading">
          פרופיל המשתמש
        </h1>
        <p className="profile-sub">{typedText}</p>
      </header>

      <main className="container-xl">
        <section className="glass-card profile-card">
          <div className="profile-grid">
            <div className="profile-field">
              <div className="label">שם משתמש</div>
              <div className="value">{userData.username || '—'}</div>
            </div>

            <div className="profile-field">
              <div className="label">אימייל</div>
              <div className="value">{auth.currentUser?.email || '—'}</div>
            </div>

            <div className="profile-field">
              <div className="label">טלפון</div>
              <div className="value">{userData.phone || '—'}</div>
            </div>

            <div className="profile-field">
              <div className="label">מגדר</div>
              <div className="value">{userData.gender || '—'}</div>
            </div>
          </div>

          <div className="profile-actions">
            <Link to="/edit_profile" className="fc-btn fc-btn--two">ערוך פרופיל</Link>
            <Link to="/change_password" className="fc-btn fc-btn--one">שינוי סיסמה</Link>
          </div>
        </section>
        <MyStyle />
      </main>
    </div>
  );
}
