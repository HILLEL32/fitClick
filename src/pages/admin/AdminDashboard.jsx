// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState, useMemo } from "react";
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
  getCountFromServer,
} from "firebase/firestore";
import "../../css/AdminDashboard.css";

export default function AdminDashboard() {
  const nav = useNavigate();
  const db = useMemo(() => getFirestore(), []);

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

      // 1) כמות משתמשים
      const usersCountSnap = await getCountFromServer(collection(db, "users"));
      const usersCount = usersCountSnap.data().count || 0;

      // 2) כמות פריטי ארון (group)
      const clothingCountSnap = await getCountFromServer(collectionGroup(db, "clothing"));
      const clothingCount = clothingCountSnap.data().count || 0;

      // 3) 5 משתמשים אחרונים
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
    <div className="container-xl" dir="rtl">
      {/* Header */}
      <header className="glass-card admin-header">
        <div className="admin-header__titles">
          <h2 className="apphome-title" style={{ margin: 0 }}>ממשק מנהל</h2>
          <div className="apphome-sub">סטטיסטיקות מהירות ומשתמשים אחרונים</div>
        </div>
        <div className="admin-header__actions">
          <Link className="adm-link" to="/admin_users">ניהול משתמשים</Link>
          <button className="adm-btn adm-btn--logout" onClick={logout}>יציאה</button>
        </div>
      </header>

      {loading ? (
        <div className="admin-loading">טוען נתונים…</div>
      ) : (
        <>
          {/* Stats */}
          <section className="admin-stats">
            <div className="admin-stat">
              <div className="admin-stat__label">משתמשים</div>
              <div className="admin-stat__value">{stats.users}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__label">פריטים בארונות</div>
              <div className="admin-stat__value">{stats.clothing}</div>
            </div>
          </section>

          {/* Recent Users */}
          <section className="admin-card">
            <h3 className="admin-card__title">משתמשים אחרונים</h3>

            {recentUsers.length === 0 ? (
              <div className="admin-empty">אין נתונים להצגה.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>שם תצוגה</th>
                      <th>אימייל</th>
                      <th>UID</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(u => (
                      <tr key={u.id}>
                        <td>{u.displayName || "—"}</td>
                        <td>{u.email || "—"}</td>
                        <td className="uid">{u.id}</td>
                        <td>
                          <Link className="table-action" to={`/admin_users/${u.id}/wardrobe`}>
                            עריכת ארון
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
