import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';


export default function EditProfile() {
  const [userData, setUserData] = useState({
    username: '',
    phone: '',
    gender: '',
    bodyColor: '#f5d3b3'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: userData.username,
        phone: userData.phone,
        gender: userData.gender,
        bodyColor: userData.bodyColor
      });
      setMessage('הפרופיל עודכן בהצלחה!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('שגיאה בעדכון הפרופיל.');
    }
  };

  if (loading) return <div className="text-center my-5">טוען...</div>;

  return (
<div className="container my-4" dir="rtl">
  <h2 className="mb-4 text-center">עריכת פרופיל</h2>

  {/* מרכז רק את הטופס */}
  <div className="mx-auto" style={{ maxWidth: '400px' }}>
    <form onSubmit={handleSubmit}>
      <label className="form-label">שם משתמש:</label>
      <input
        type="text"
        name="username"
        className="form-control my-2"
        value={userData.username}
        onChange={handleChange}
        required
      />

      <label className="form-label">מספר טלפון:</label>
      <input
        type="tel"
        name="phone"
        className="form-control my-2"
        value={userData.phone}
        onChange={handleChange}
      />

      <label className="form-label">בחרי את המגדר שלך:</label>
      <select
        name="gender"
        className="form-control"
        value={userData.gender}
        onChange={handleChange}
        required
      >
        <option value="">בחר מגדר</option>
        <option value="זכר">זכר</option>
        <option value="נקבה">נקבה</option>
        <option value="אחר">אחר / לא לציין</option>
      </select>

      <label className="form-label mt-3">בחרי את צבע גוון הגוף שלך:</label>
      <input
        type="color"
        name="bodyColor"
        className="form-control form-control-color mb-3"
        value={userData.bodyColor}
        onChange={handleChange}
        title="בחר צבע גוף"
      />

      <button type="submit" className="btn btn-outline-warning mt-3">
        שמור שינויים
      </button>
    </form>

    {message && <div className="alert alert-info mt-3">{message}</div>}
  </div>

  <Link to="/app_home" className="btn btn-success btn-lg floating-button">
    back to home
  </Link>
</div>

  );
}
