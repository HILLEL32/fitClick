// src/pages/Log_in.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth'; // ⬅️ הוספתי signOut
import { auth, db } from '../firebase/firebase';                                             // ⬅️ הוספתי db
import { doc, getDoc } from 'firebase/firestore';                                            // ⬅️ חדש
import { useNavigate, Link } from 'react-router-dom';
import '../css/Log_in.css'; // קובץ העיצוב הקיים

export default function Log_in() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // בדיקת חסימה רכה מיד אחרי התחברות
      const uid = cred.user.uid;
      const userDoc = await getDoc(doc(db, "users", uid));
      const isBlocked = userDoc.exists() && userDoc.data().isBlocked === true;

      if (isBlocked) {
        await signOut(auth);
        alert('החשבון שלך נחסם. פנה/י לתמיכה.');
        return; // לא נכנסים פנימה
      }

      alert('התחברת בהצלחה!');
      navigate('/app_home');
    } catch (error) {
      alert('אימייל או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('יש למלא כתובת מייל');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('נשלח אליך מייל לאיפוס סיסמה. בדקי/בדוק את תיבת הדואר והוראות האיפוס.');
    } catch (error) {
      alert('לא ניתן לשלוח מייל איפוס: ' + error.message);
    }
  };

  return (
    <div className="login-page" dir="rtl">
      {/* overlay טעינה – ייראה רק כש-loading true */}
      {loading && (
        <div className="loading-overlay">
          <span className="loader" aria-label="טוען..."></span>
        </div>
      )}

      {/* שכבת טקסטורה ועדינות */}
      <div className="login-overlay" />
      {/* דקורציות בלובס */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      <div className="login-card glass-card">
        <h1 className="login-title">כניסה</h1>

        <div className="login-form">
          <label className="form-label login-label">אימייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control fc-input"
            placeholder="name@email.com"
            disabled={loading}
          />

          <label className="form-label login-label mt-2">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control fc-input"
            placeholder="••••••••"
            disabled={loading}
          />

          <div className="actions">
            <button onClick={handleLogin} className="btn btn-auth-primary" disabled={loading}>
              התחברות
            </button>

            <button onClick={handleForgotPassword} className="btn btn-ghost" disabled={loading}>
              שכחתי סיסמה
            </button>

            <Link to="/change_password" className={`btn btn-ghost ${loading ? 'disabled-link' : ''}`}>
              שינוי סיסמה
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
