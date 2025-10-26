import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../css/Header.css";

export default function Header() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // האזנה למצב המשתמש
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role || "user");
        } else {
          setRole("user");
        }
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // התנתקות
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // שם תצוגה של המשתמש
  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "משתמש";
  }, [user]);

  const simplePages = ["/", "/log_in", "/sign_up"];
  const isSimplePage = simplePages.includes(location.pathname);

  return (
    <header className="header" dir="rtl">
      <div className="header-container">
        {/* לוגו וסטטוס משתמש */}
        <div className="header-logo">
          <span className="dot"></span> FitClick
          {user && (
            <div className="user-role">
              {role === "admin" ? "מנהל " : " משתמש "}
            </div>
          )}
        </div>

        <nav className="header-nav">
          {!user || isSimplePage ? (
            <>
              <Link to="/about" className="nav-link">אודות</Link>
              <Link to="/" className="nav-link">דף הבית</Link>
              <Link to="/log_in" className="nav-link">כניסה</Link>
              <Link to="/sign_up" className="nav-btn nav-btn-primary">הרשמה</Link>
            </>
          ) : (
            <>
              <span className="user-name">שלום, {displayName}</span>
              {role === "admin" ? (
                <Link to="/admin_dashboard" className="nav-link">
                  חזרה לדשבורד
                </Link>
              ) : (
                <Link to="/app_home" className="nav-link">
                  חזרה לדף הבית
                </Link>
              )}
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
