// src/pages/admin/AdminSignUp.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AdminSignUp() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (adminCode !== process.env.REACT_APP_ADMIN_CODE) {
        setError("קוד מנהלים שגוי");
        return;
      }
      const auth = getAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });

      const db = getFirestore();
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName: displayName || "",
        email,
        role: "admin",
        createdAt: serverTimestamp(),
      });

      nav("/admin/dashboard");
    } catch (err) {
      setError(err.message || "שגיאה בהרשמה");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>הרשמת מנהל</h2>
      <form onSubmit={onSubmit}>
        <label>שם תצוגה</label>
        <input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
        <label>אימייל</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} />
        <label>סיסמה</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <label>קוד מנהלים</label>
        <input value={adminCode} onChange={(e)=>setAdminCode(e.target.value)} />
        <button type="submit">הרשמה</button>
      </form>
      {error && <p style={{color:"crimson"}}>{error}</p>}
      <p>כבר יש חשבון מנהל? <Link to="/admin/login">כניסה</Link></p>
    </div>
  );
}
