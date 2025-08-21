// src/pages/Log_in.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useNavigate, Link } from 'react-router-dom';
import '../css/Log_in.css'; // ← קובץ העיצוב החדש

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
      alert('אירעה שגיאה: ' + error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('נא להזין כתובת מייל קודם');
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
    <div className="container login-page" dir="rtl">
      <div className="login-card">
        <h1 className="login-title">כניסה</h1>

        <div className="login-form">
          <label className="form-label login-label">אימייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control fc-input"
          />

          <label className="form-label login-label mt-2">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control fc-input"
          />

          <div className="d-flex gap-2 flex-wrap mt-3">
            <button onClick={handleLogin} className="btn btn-auth-primary">
              Log In
            </button>

            <button onClick={handleForgotPassword} className="btn btn-ghost">
              שכחתי סיסמה
            </button>

            <Link to="/change_password" className="btn btn-ghost">
              שינוי סיסמה (למחוברים)
            </Link>
          </div>
        </div>

        <Link to="/" className="btn floating-button">
          חזרה לעמוד הראשי
        </Link>
      </div>
    </div>
  );
}
