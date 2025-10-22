// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  collectionGroup,
  getDocs,
  query,
  orderBy,
  limit,
  // ספירת מסמכים (Aggregation API)
  getCountFromServer,
} from "firebase/firestore";

export default function AdminDashboard() {
  const nav = useNavigate();
  const db = getFirestore();

  const [stats, setStats] = useState({ users: 0, clothing: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await signOut(getAuth());
    nav("/");
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // 1) כמות משתמשים (users count)
      const usersCountSnap = await getCountFromServer(collection(db, "users"));
      const usersCount = usersCountSnap.data().count || 0;

      // 2) כמות פריטי ארון (באמצעות collectionGroup על כל users/*/clothing)
      // אם עוד אין לכם תת־אוספים בשם clothing — זה יחזיר 0
      const clothingCountSnap = await getCountFromServer(collectionGroup(db, "clothing"));
      const clothingCount = clothingCountSnap.data().count || 0;

      // 3) 5 משתמשים אחרונים (על בסיס createdAt)
      // ודאו שאתם שומרים createdAt: serverTimestamp() במסמך user בזמן ההרשמה
      const qRecent = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
      const recentSnap = await getDocs(qRecent);
      const recent = recentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setStats({ users: usersCount, clothing: clothingCount });
      setRecentUsers(recent);
      setLoading(false);
    };

    load();
  }, [db]);

  return (
    <div style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px" }} dir="rtl">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>ממשק מנהל</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/admin/users">ניהול משתמשים</Link>
          <button onClick={logout}>יציאה</button>
        </div>
      </header>

      {loading ? (
        <p>טוען נתונים…</p>
      ) : (
        <>
          {/* סטטיסטיקות קצרות */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, color: "#666" }}>משתמשים</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.users}</div>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, color: "#666" }}>פריטים בארונות</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.clothing}</div>
            </div>
          </section>

          {/* משתמשים אחרונים */}
          <section>
            <h3 style={{ marginTop: 0 }}>משתמשים אחרונים</h3>
            {recentUsers.length === 0 ? (
              <p>אין נתונים להצגה.</p>
            ) : (
              <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <th align="right">שם תצוגה</th>
                    <th align="right">אימייל</th>
                    <th align="right">UID</th>
                    <th align="right">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(u => (
                    <tr key={u.id} style={{ borderTop: "1px solid #f2f2f2" }}>
                      <td>{u.displayName || "—"}</td>
                      <td>{u.email || "—"}</td>
                      <td dir="ltr" style={{ fontFamily: "monospace" }}>{u.id}</td>
                      <td>
                        <Link to={`/admin/users/${u.id}/wardrobe`}>עריכת ארון</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
