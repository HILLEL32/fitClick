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
        const docRef = doc(db, 'users', user.uid); // ← הדרך הנכונה לפי rules
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
      <h5>welcome to {username}</h5>

      {/* <Link to="/gender" className="btn btn-success btn-lg custom-green-button">gender</Link>
      <Link to="/bodyColor" className="btn btn-success btn-lg custom-green-button">body color</Link> */}
      <Link to="/user_profile" className="btn btn-success btn-lg custom-green-button">user profile</Link>
      {/* <Link to="/add_clothing" className="btn btn-success btn-lg custom-green-button">add clothing</Link> */}
      <Link to="/clothing_ai" className="btn btn-success btn-lg custom-green-button">AI garment inspection</Link>
      <Link to="/wardrobe" className="btn btn-success btn-lg custom-green-button">my wardrobe </Link>
    </div>
  );
}
