import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { Link } from 'react-router-dom';
import '../css/Sign_up.css'; // ← קובץ העיצוב החדש

export default function Sign_up() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  // const [bodyColor, setBodyColor] = useState('#f5d3b3');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setMessage('הסיסמה צריכה להיות לפחות באורך 6 תווים');
      return;
    }

    if (!gender) {
      setMessage('יש לבחור מגדר');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await setDoc(doc(db, 'users', user.uid), {
          email,
          username,
          phone,
          gender,
          bodyColor,   // נשאר כפי שהוא – אין שינויי לוגיקה
          clothes: [],
          createdAt: new Date()
        });

        setMessage('ההרשמה הצליחה!');
      } catch (firestoreError) {
        console.error('שגיאה בשמירת הנתונים:', firestoreError);
        setMessage('ההרשמה הצליחה, אך שמירת הנתונים נכשלה.');
      }

    } catch (authError) {
      console.error('שגיאה בהרשמה:', authError);
      if (authError.code === 'auth/email-already-in-use') {
        setMessage('האימייל הזה כבר רשום במערכת.');
      } else {
        setMessage('שגיאה בהרשמה: ' + authError.message);
      }
    }
  };

  return (
    <div className="container sign-up-page" dir="rtl">
      <div className="sign-up-card">
        <h2 className="sign-up-title">הרשמה</h2>

        <form onSubmit={handleSubmit} className="sign-up-form">
          <input
            type="text"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control fc-input"
            required
          />

          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control fc-input"
            required
          />

          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control fc-input"
            required
          />

          <input
            type="tel"
            placeholder="טלפון"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="form-control fc-input"
          />

          <label className="form-label sign-up-label mt-2">מגדר</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="form-control fc-input"
            required
          >
            <option value="">בחר מגדר</option>
            <option value="זכר">זכר</option>
            <option value="נקבה">נקבה</option>
            <option value="אחר">אחר / לא לציין</option>
          </select>

          {/* 
          <label className="form-label sign-up-label mt-3">צבע גוף</label>
          <input
            type="color"
            value={bodyColor}
            onChange={(e) => setBodyColor(e.target.value)}
            className="form-control form-control-color fc-color"
            title="בחר צבע גוף"
          /> 
          */}

          <button type="submit" className="btn btn-auth-primary mt-3">
            הירשם
          </button>
        </form>

        {message && <div className="alert alert-info mt-3 text-center">{message}</div>}

        <Link to="/" className="btn btn-success btn-lg floating-button">
          חזרה לעמוד הראשי
        </Link>
      </div>
    </div>
  );
}
