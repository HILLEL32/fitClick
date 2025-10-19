// src/pages/admin/AdminLogin.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function AdminLogin() {
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
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const db = getFirestore();
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists() || snap.data().role !== "admin") {
        await signOut(auth);
        setError("אין הרשאת מנהל לחשבון זה");
        return;
      }
      nav("/admin/dashboard");
    } catch (err) {
      setError(err.message || "שגיאה בהתחברות");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>כניסת מנהלים</h2>
      <form onSubmit={onSubmit}>
        <label>אימייל</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} />
        <label>סיסמה</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <label>קוד מנהלים</label>
        <input value={adminCode} onChange={(e)=>setAdminCode(e.target.value)} />
        <button type="submit">כניסה</button>
      </form>
      {error && <p style={{color:"crimson"}}>{error}</p>}
      <p>אין לך משתמש מנהל? <Link to="/admin/signup">להרשמת מנהל</Link></p>
    </div>
  );
}
