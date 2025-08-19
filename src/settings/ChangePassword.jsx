import React, { useState } from 'react';
import { auth } from '../firebase/firebase';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

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

      // אימות מחדש לפני שינוי סיסמה
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);

      // שינוי הסיסמה
      await updatePassword(user, newPwd);
      alert('הסיסמה עודכנה בהצלחה!');
      navigate('/app_home');
    } catch (err) {
      alert('שגיאה בעדכון הסיסמה: ' + err.message);
    }
  };

  return (
    <div className="container mt-3">
      <h6 className='line'>שינוי סיסמה</h6>
      <div className='container'>
        <strong>סיסמה נוכחית:</strong><br />
        <input
          type="password"
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
        /><br />

        <strong>סיסמה חדשה:</strong><br />
        <input
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
        /><br />

        <strong>אימות סיסמה חדשה:</strong><br />
        <input
          type="password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
        /><br /><br />

        <div className="d-flex gap-2 flex-wrap">
          <button onClick={handleChangePassword} className="btn btn-success mb-4">
            עדכון סיסמה
          </button>
          <Link to="/app_home" className="btn btn-outline-secondary mb-4">
            חזרה
          </Link>
        </div>
      </div>
    </div>
  );
}
