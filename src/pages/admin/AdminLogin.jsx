import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "../../css/AdminSignUp.css"; // ממחזר את עיצוב ההרשמה

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nav = useNavigate();
  const { state } = useLocation(); // הודעה מדף ההרשמה

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    const auth = getAuth();
    const db = getFirestore();

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      // בדיקת תפקיד ב־Firestore
      const userRef = doc(db, "users", cred.user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await signOut(auth);
        throw new Error("לא נמצאו נתוני משתמש. פנו למנהל המערכת.");
      }

      const data = snap.data();
      if (data.role !== "admin") {
        await signOut(auth);
        throw new Error("אין לך הרשאת מנהל.");
      }

      // ✅ מסלול תואם ל-App.jsx: /admin_dashboard
      nav("/admin_dashboard");
    } catch (err) {
      setError(err?.message || "שגיאה בהתחברות");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="su-page" dir="rtl">
      <div className="su-overlay" />
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      <section className="glass-card">
        <h1 className="su-title">כניסת מנהלים</h1>

        {/* הודעת הצלחה מדף ההרשמה (לא חובה) */}
        {state?.msg && <div className="su-alert success">{state.msg}</div>}

        {/* הודעת שגיאה */}
        {error && <div className="su-alert">{error}</div>}

        <form className="su-form" onSubmit={onSubmit}>
          <label className="su-label">אימייל</label>
          <input
            className="fc-input"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label className="su-label">סיסמה</label>
          <div className="fc-input with-addon">
            <input
              className="fc-input"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="input-addon-btn"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "הסתר סיסמה" : "הצג סיסמה"}
              title={showPwd ? "הסתר סיסמה" : "הצג סיסמה"}
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>

          <button type="submit" className="btn btn-cta" disabled={busy}>
            {busy ? "מתחבר..." : "התחברות"}
          </button>
        </form>

        <div className="meta-links">
          <Link to="/admin_signup" className="back-btn">
            אין לך חשבון מנהל? הרשמה
          </Link>
        </div>
      </section>
    </div>
  );
}
