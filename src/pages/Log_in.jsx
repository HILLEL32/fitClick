import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase' 
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function Log_in() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // מאפשר ניווט לאחר התחברות

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('התחברת בהצלחה!');
      navigate('/app_home'); // נווט לעמוד הבית או כל עמוד שתרצה
    } catch (error) {
      alert('אירעה שגיאה: ' + error.message);
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

        <button onClick={handleLogin}>Log In</button>
      </div>
      <Link to="/" className="btn btn-success btn-lg floating-button">
        back to home
      </Link>

    </div>
  );
}
