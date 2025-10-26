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
  where,
  getCountFromServer,
} from "firebase/firestore";
import "../../css/AdminDashboard.css";
import AdminItemsDetectedChart from "../../component/AdminItemsDetectedChart";

export default function AdminDashboard() {
  const nav = useNavigate();
  const db = useMemo(() => getFirestore(), []);

  const [stats, setStats] = useState({
    users: 0,
    clothingTotal: 0,
    avgItemsPerUser: 0,
    newUsersThisWeek: 0,
    aiUploadsRatio: 0, // באחוזים
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const logout = async () => {
    await signOut(getAuth());
    nav("/");
  };

  /** ===== Helpers ===== */
  const DEBUG_COUNTS = false; // שנה ל-true אם תרצה לוגים לקונסול

  async function safeCount(ref, label) {
    try {
      const snap = await getCountFromServer(ref);
      const c = snap.data().count || 0;
      if (DEBUG_COUNTS) console.log(`[COUNT] ${label}:`, c);
      return c;
    } catch (e) {
      if (DEBUG_COUNTS) console.warn(`[COUNT] ${label} FAILED:`, e?.message || e);
      return 0;
    }
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  /** ===== Data load ===== */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        // Users
        const usersCount = await safeCount(collection(db, "users"), "top: users");

        // Wardrobe items – תומך גם באוספים עליונים וגם ב-collectionGroup
        const topClothing = await safeCount(collection(db, "clothing"), "top: clothing");
        const grpClothing = await safeCount(collectionGroup(db, "clothing"), "group: clothing");
        const clothingA = Math.max(topClothing, grpClothing);

        const topClothingItems = await safeCount(collection(db, "clothingItems"), "top: clothingItems");
        const grpClothingItems = await safeCount(collectionGroup(db, "clothingItems"), "group: clothingItems");
        const clothingB = Math.max(topClothingItems, grpClothingItems);

        const clothingTotal = clothingA + clothingB;

        // נגזרות פשוטות:
        const avgItemsPerUser = usersCount ? +(clothingTotal / usersCount).toFixed(1) : 0;
        const aiUploadsRatio =
          clothingTotal > 0 ? Math.round((clothingB / clothingTotal) * 100) : 0;

        // Users registered this week (count query פשוט)
        let newUsersThisWeek = 0;
        try {
          const since = startOfDay(new Date());
          since.setDate(since.getDate() - 6); // 7 הימים האחרונים כולל היום
          const qWeek = query(collection(db, "users"), where("createdAt", ">=", since));
          newUsersThisWeek = await safeCount(qWeek, "users this week");
        } catch {
          newUsersThisWeek = 0;
        }

        // Recent users (by createdAt; fallback by __name__)
        let recent = [];
        try {
          const qRecent = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(5)
          );
          const snap = await getDocs(qRecent);
          recent = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch {
          const qRecentById = query(collection(db, "users"), orderBy("__name__", "desc"), limit(5));
          const snap = await getDocs(qRecentById);
          recent = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        setStats({
          users: usersCount,
          clothingTotal,
          avgItemsPerUser,
          newUsersThisWeek,
          aiUploadsRatio,
        });
        setRecentUsers(recent);
      } catch (err) {
        console.error(err);
        setErrMsg(
          err?.message === "Missing or insufficient permissions."
            ? "אין לך הרשאות לקרוא את המידע (403). ודא/י שה־role שלך הוא admin וחוקי האבטחה מעודכנים."
            : err?.message || "שגיאה בלתי צפויה בטעינת נתונים"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [db]);

  /** ===== UI ===== */
  return (
    <div className="container-xl" dir="rtl">
      {/* Header */}
      <header className="glass-card admin-header">
        <div className="admin-header__titles">
          <h2 className="apphome-title" style={{ margin: 0 }}>ממשק מנהל</h2>
          <div className="apphome-sub">סטטיסטיקות מהירות, גרף זיהויים ומשתמשים אחרונים</div>
        </div>
        <div className="admin-header__actions">
          <Link className="adm-link" to="/admin_users">ניהול משתמשים</Link>
          <button className="adm-btn adm-btn--logout" onClick={logout}>יציאה</button>
        </div>
      </header>

      {errMsg && (
        <div className="admin-error glass-card" style={{ marginTop: 16 }}>
          {errMsg}
        </div>
      )}

      {loading ? (
        <div className="admin-loading">טוען נתונים…</div>
      ) : (
        <>
          {/* Quick stats */}
          <section className="admin-stats">
            <div className="admin-stat">
              <div className="admin-stat__label">משתמשים</div>
              <div className="admin-stat__value">{stats.users}</div>
            </div>

            <div className="admin-stat">
              <div className="admin-stat__label">פריטים בארונות</div>
              <div className="admin-stat__value">{stats.clothingTotal}</div>
            </div>

            <div className="admin-stat">
              <div className="admin-stat__label">ממוצע פריטים למשתמש</div>
              <div className="admin-stat__value">{stats.avgItemsPerUser}</div>
            </div>

            <div className="admin-stat">
              <div className="admin-stat__label">נרשמו השבוע</div>
              <div className="admin-stat__value">{stats.newUsersThisWeek}</div>
            </div>

            <div className="admin-stat">
              <div className="admin-stat__label">העלאות AI</div>
              <div className="admin-stat__value">{stats.aiUploadsRatio}%</div>
            </div>
          </section>

          {/* Chart */}
          <section className="admin-card admin-card--chart">
            <div style={{ direction: "ltr" }}>
              <AdminItemsDetectedChart />
            </div>
          </section>

          {/* Recent users */}
          <section className="admin-card">
            <h3 className="admin-card__title">משתמשים אחרונים</h3>

            {recentUsers.length === 0 ? (
              <div className="admin-empty">אין נתונים להצגה.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table" aria-label="טבלת משתמשים אחרונים">
                  <thead>
                    <tr>
                      <th>שם תצוגה</th>
                      <th>אימייל</th>
                      <th>UID</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u) => (
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
