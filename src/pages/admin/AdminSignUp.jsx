// src/pages/admin/AdminSignUp.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../../css/AdminSignUp.css";

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
      const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || "1212";
      if (adminCode.trim() !== String(ADMIN_CODE)) {
        setError("קוד מנהלים שגוי");
        return;
      }

      const auth = getAuth();
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }

      const db = getFirestore();
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName: displayName.trim() || "",
        email: email.trim().toLowerCase(),
        role: "admin",
        createdAt: serverTimestamp(),
      });

      // ✅ חשוב: מתנתקים כדי שהדף "כניסת מנהלים" יהיה באמת תהליך Login
      await signOut(auth);

      // ✅ מעבירים את המנהל הטרי לדף כניסה, עם הודעת הצלחה ידידותית (אופציונלי)
      nav("/admin_login", { state: { msg: "נרשמת בהצלחה! התחברי עם פרטי המנהל שלך." } });

    } catch (err) {
      setError(err?.message || "שגיאה בהרשמה");
    }
  };

  return (
    <div className="su-page" dir="rtl">
      <div className="su-overlay" />
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      <section className="glass-card">
        <h1 className="su-title">הרשמת מנהל</h1>

        <form className="su-form" onSubmit={onSubmit}>
          <label className="su-label">שם משתמש</label>
          <input className="fc-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

          <label className="su-label">אימייל</label>
          <input className="fc-input" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="su-label">סיסמה</label>
          <input className="fc-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <label className="su-label">קוד מנהלים</label>
          <input className="fc-input" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} />

          <button type="submit" className="btn btn-cta">הרשמה</button>
        </form>

        {error && <div className="su-alert">{error}</div>}

        <Link to="/admin_login" className="back-btn">כבר יש חשבון מנהל? כניסה</Link>
      </section>
    </div>
  );
}
