import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/AppHome.css';   // מחובר לקובץ ה־CSS החדש
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AppHome() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsername(userData.username);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="apphome-wrapper">
      <h1> !!! fitclick ברוכים הבאים ל {username}</h1>

      <div className="apphome-card">
        <h3 className="apphome-title"></h3>

        <div className="apphome-actions">
          <Link to="/user_profile" className="fc-btn fc-btn--one">פרופיל</Link>
          <Link to="/clothing_ai" className="fc-btn fc-btn--two">לזיהוי בגד</Link>
          <Link to="/wardrobe" className="fc-btn fc-btn--three">ארון הבגדים שלי</Link>
        </div>
      </div>
    </div>
  );
}
