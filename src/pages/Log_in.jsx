// src/pages/Log_in.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useNavigate, Link } from 'react-router-dom';

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
    <div className='container mt-3'>
      <h1 className='line'>Log In</h1>
      <div className='container'>
        <strong>Email:</strong> <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /> <br />

        <strong>Password:</strong> <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /> <br /><br />

        <div className="d-flex gap-2 flex-wrap">
          <button onClick={handleLogin} className='btn btn-success mb-4'>Log In</button>
          <button onClick={handleForgotPassword} className='btn btn-outline-secondary mb-4'>
            שכחתי סיסמה
          </button>
          <Link to="/change_password" className="btn btn-outline-primary mb-4">
            שינוי סיסמה (למחוברים)
          </Link>
        </div>
      </div>

      <Link to="/" className="btn btn-success btn-lg floating-button">
        חזרה לעמוד הראשי
      </Link>
    </div>
  );
}
