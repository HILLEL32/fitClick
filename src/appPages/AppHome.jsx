import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/design.css';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AppHome() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid); 
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsername(userData.username);
        }
      }
    });
    return () => unsubscribe(); 
  }, []);
  return (
    <div className='container mt-5 text-center'>
      {/* <h3>{username}ברוכים הבאים ל fitclick !! </h3> */}
      <h3>!!! fitclick ברוכים הבאים ל {username}</h3>
      <Link to="/user_profile" className="btn btn-success btn-lg custom-green-button">פרופיל</Link>
      <Link to="/clothing_ai" className="btn btn-success btn-lg custom-green-button">לזיהוי בגד</Link>
      <Link to="/wardrobe" className="btn btn-success btn-lg custom-green-button">ארון הבגדים שלי </Link>
    </div>
  );
}
