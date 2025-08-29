import React, { useState } from 'react';
import { auth } from '../firebase/firebase';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import '../css/ChangePassword.css'; // ← קובץ העיצוב החדש

export default function ChangePassword() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const navigate = useNavigate();

  const handleChangePassword = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('אין משתמש מחובר. התחבר/י מחדש.');
        return;
      }
      if (!currentPwd || !newPwd || !confirmPwd) {
        alert('כל השדות חייבים להיות מלאים');
        return;
      }
      if (newPwd.length < 6) {
        alert('סיסמה חדשה חייבת להיות באורך 6 תווים לפחות');
        return;
      }
      if (newPwd !== confirmPwd) {
        alert('הסיסמה לא מתאימה אחת לשנייה');
        return;
      }

      // אימות מחדש
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);

      // שינוי סיסמה
      await updatePassword(user, newPwd);
      alert('הסיסמה עודכנה בהצלחה!');
      navigate('/app_home');
    } catch (err) {
      alert('שגיאה בעדכון הסיסמה: ' + err.message);
    }
  };

  return (
    <div className="cp-page" dir="rtl">
      {/* שכבת טקסטורה ועדינות */}
      <div className="cp-overlay" />
      {/* דקורציות בלובס */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      {/* כרטיס הזכוכית */}
      <div className="cp-card glass-card">
        <h1 className="cp-title">שינוי סיסמה</h1>

        <div className="cp-form">
          <label className="cp-label">סיסמה נוכחית</label>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className="cp-input"
            placeholder="••••••••"
          />

          <label className="cp-label">סיסמה חדשה</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="cp-input"
            placeholder="מינימום 6 תווים"
          />

          <label className="cp-label">אימות סיסמה חדשה</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="cp-input"
            placeholder="הזיני שוב את הסיסמה"
          />

          <div className="cp-actions">
            <button onClick={handleChangePassword} className="btn btn-cta">
              עדכון סיסמה
            </button>
            <Link to="/app_home" className="btn btn-ghost">
              חזרה
            </Link>
          </div>
        </div>
      </div>

      {/* כפתור תחתון עקבי (אופציונלי) */}
      <Link to="/" className="btn back-btn">חזרה לעמוד הראשי</Link>
    </div>
  );
}
