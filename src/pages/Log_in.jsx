// src/pages/Log_in.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useNavigate, Link } from 'react-router-dom';
import '../css/Log_in.css'; // קובץ העיצוב החדש


export default function Log_in() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('התחברת בהצלחה!');
      navigate('/app_home');
    } catch (error) {
      alert(' נסה שוב: ' + error.message);
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
          />

          <label className="form-label login-label mt-2">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control fc-input"
            placeholder="••••••••"
          />

          <div className="actions">
            <button onClick={handleLogin} className="btn btn-auth-primary">
              התחברות
            </button>

            <button onClick={handleForgotPassword} className="btn btn-ghost">
              שכחתי סיסמה
            </button>

            <Link to="/change_password" className="btn btn-ghost">
              שינוי סיסמה 
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
