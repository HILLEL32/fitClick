import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { Link } from 'react-router-dom';
import '../css/Sign_up.css';

export default function Sign_up() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [bodyColor, setBodyColor] = useState('#f5d3b3');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setMessage('הסיסמה צריכה להיות לפחות באורך 6 תווים'); return; }
    if (!gender) { setMessage('יש לבחור מגדר'); return; }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email, username, phone, gender, bodyColor, clothes: [], createdAt: new Date()
        });
        setMessage('ההרשמה הצליחה!');
      } catch (firestoreError) {
        console.error('שגיאה בשמירת הנתונים:', firestoreError);
        setMessage('ההרשמה הצליחה, אך שמירת הנתונים נכשלה.');
      }
    } catch (authError) {
      console.error('שגיאה בהרשמה:', authError);
      setMessage(authError.code === 'auth/email-already-in-use'
        ? 'האימייל הזה כבר רשום במערכת.' 
        : 'שגיאה בהרשמה: ' + authError.message);
    }
  };

  return (
    <div className="su-page" dir="rtl">
      {/* שכבת טקסטורה ובלובים */}
      <div className="su-overlay" />
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      <div className="su-card glass-card">
        <h1 className="su-title">הרשמה</h1>

        <form onSubmit={handleSubmit} className="su-form">
          <input
            type="text" placeholder="שם משתמש"
            value={username} onChange={(e) => setUsername(e.target.value)}
            className="form-control fc-input" required
          />
          <input
            type="email" placeholder="אימייל"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="form-control fc-input" required
          />
          <input
            type="password" placeholder="סיסמה (מינ׳ 6 תווים)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="form-control fc-input" required
          />
          <input
            type="tel" placeholder="טלפון (לא חובה)"
            value={phone} onChange={(e) => setPhone(e.target.value)}
            className="form-control fc-input"
          />

          <label className="form-label su-label mt-2">מגדר</label>
          <select
            value={gender} onChange={(e) => setGender(e.target.value)}
            className="form-control fc-input" required
          >
            <option value="">בחר מגדר</option>
            <option value="זכר">זכר</option>
            <option value="נקבה">נקבה</option>
            <option value="אחר">אחר / לא לציין</option>
          </select>

          <button type="submit" className="btn btn-cta mt-2">הירשם</button>
        </form>

        {message && <div className="su-alert">{message}</div>}
      </div>

    </div>
  );
}
