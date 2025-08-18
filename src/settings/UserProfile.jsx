import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';


export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <div className="text-center my-5">טוען פרופיל...</div>;
  if (!userData) return <div className="text-center text-danger">לא נמצא משתמש מחובר.</div>;

  return (
    <div className="container my-4" dir="rtl">
      <h2 className="mb-4 text-center">פרופיל המשתמש</h2>
      <div className="mx-auto" style={{ maxWidth: '400px' }}>
        <ul className="list-group">
          <li className="list-group-item"><strong>שם משתמש:</strong><br /> {userData.username}</li>
          <li className="list-group-item"><strong>אימייל:</strong><br /> {auth.currentUser.email}</li>
          <li className="list-group-item"><strong>טלפון:</strong><br /> {userData.phone}</li>
          <li className="list-group-item"><strong>מגדר:</strong><br /> {userData.gender}</li>
          <li className="list-group-item">
            <strong>צבע גוף:</strong><br />
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: userData.bodyColor,
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginTop: '5px'
              }}
              title={userData.bodyColor}
            ></div>
          </li>
        </ul>

        <Link to="/edit_profile" className="btn btn-outline-warning mt-3">ערוך פרופיל</Link>
      </div>
      <Link to="/app_home" className="btn btn-success btn-lg floating-button">
        back to home
      </Link>
    </div>
  );
}
