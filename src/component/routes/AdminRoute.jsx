// src/component/routes/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsub = onAuthStateChanged(auth, async (user)=> {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      setIsAdmin(snap.exists() && snap.data().role === "admin");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div>טוען…</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}
