import { useRef } from 'react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/AppHome.css';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';


export default function AppHome() {
  const [username, setUsername] = useState('');
  const [typedText, setTypedText] = useState("");
  const fullText = "היועץ הדיגיטלי לסטייל שלך — העלה/י פריטים, קבל/י שילובים חכמים, וצא/י כל יום בלוק מנצח.";
  const idxRef = useRef(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsername(userData.username || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
  return (
    <div className="apphome-page" dir="rtl">
      {/* שכבת טקסטורה ועדינות */}
      <div className="apphome-overlay" />
      {/* בלובים זזים */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      <header className="apphome-hero container-xl">


        <h1 className="apphome-heading">
          {username} ברוכים הבאים ל <br /> <span className="brand">fitClick</span>
        </h1>

        <p className="apphome-sub typewriter">{typedText}</p>

      </header>

      <main className="apphome-card glass-card container-xl">
        <h2 className="apphome-title">מה תרצה/י לעשות היום?</h2>
        <div className="apphome-actions">
          <Link to="/user_profile" className="fc-btn fc-btn--one">פרופיל</Link>
          <Link to="/clothing_ai" className="fc-btn fc-btn--two">לזיהוי בגד</Link>
          <Link to="/wardrobe" className="fc-btn fc-btn--three">ארון הבגדים שלי</Link>
        </div>
      </main>
    </div>
  );
}
