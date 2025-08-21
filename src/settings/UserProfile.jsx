import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../css/UserProfile.css'; // ← קובץ העיצוב החדש

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
    <div className="container profile-wrapper" dir="rtl">
      <h2 className="profile-heading text-center">פרופיל המשתמש</h2>

      <div className="profile-card mx-auto">
        <ul className="list-group profile-list">
          <li className="list-group-item profile-item">
            <strong>שם משתמש:</strong><br /> {userData.username}
          </li>
          <li className="list-group-item profile-item">
            <strong>אימייל:</strong><br /> {auth.currentUser.email}
          </li>
          <li className="list-group-item profile-item">
            <strong>טלפון:</strong><br /> {userData.phone}
          </li>
          <li className="list-group-item profile-item">
            <strong>מגדר:</strong><br /> {userData.gender}
          </li>
          <li className="list-group-item profile-item">
            <strong>צבע גוף:</strong><br />
            <div
              className="bodycolor-swatch"
              style={{ backgroundColor: userData.bodyColor }}
              title={userData.bodyColor}
            />
          </li>
        </ul>

        <Link to="/edit_profile" className="btn btn-edit mt-3">ערוך פרופיל</Link>
      </div>

      <Link to="/app_home" className="btn btn-home floating-button">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
