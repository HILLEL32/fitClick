import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "../css/Header.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // מאזין למצב המשתמש
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // התנתקות
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/"); // חזרה לדף הבית לאחר התנתקות
  };

  // הצגת שם המשתמש
  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "משתמש";
  }, [user]);

  // דפים שבהם מוצג רק התפריט הפשוט
  const simplePages = ["/", "/log_in", "/sign_up"];
  const isSimplePage = simplePages.includes(location.pathname);

  return (
    <header className="header" dir="rtl">
      <div className="header-container">
        {/* לוגו - לא קישור */}
        <div className="header-logo">
          <span className="dot"></span> FitClick
        </div>

        <nav className="header-nav">
          {!user || isSimplePage ? (
            // === מצב: אין משתמש מחובר (או שנמצאים בדף כניסה/הרשמה) ===
            <>
              <Link to="/" className="nav-link">דף הבית</Link>
              <Link to="/log_in" className="nav-link">כניסה</Link>
              <Link to="/sign_up" className="nav-btn nav-btn-primary">הרשמה</Link>
            </>
          ) : (
            // === מצב: משתמש מחובר ===
            <>
              <span className="user-name">שלום, {displayName}</span>
              <Link to="/app_home" className="nav-link">חזרה לדף הבית</Link>
              <button onClick={handleLogout} className="nav-btn nav-btn-ghost">
                התנתקות
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
