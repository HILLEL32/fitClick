// src/pages/admin/AdminDashboard.jsx
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const nav = useNavigate();
  const logout = async () => {
    await signOut(getAuth());
    nav("/");
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h2>ממשק מנהל</h2>
      <p>כאן נשים סטטיסטיקות, ניהול קטגוריות/סגנונות, משתמשים ועוד.</p>
      <button onClick={logout}>יציאה</button>
    </div>
  );
}
