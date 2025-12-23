// src/pages/admin/AdminUsers.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "../../css/AdminUsers.css";
import AdminItemsDetectedChart from "../../component/AdminItemsDetectedChart";
import { Link } from "react-router-dom";

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const db = useMemo(() => getFirestore(), []);

  //  all users (for filtering)
  const [allRows, setAllRows] = useState([]);

  //  current page rows
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination (client-side)
  const [pageIndex, setPageIndex] = useState(0);

  //  filters
  const [q, setQ] = useState(""); // email / displayName
  const [blockedFilter, setBlockedFilter] = useState("all"); // all | blocked | not_blocked
  const [roleFilter, setRoleFilter] = useState("all"); // all | admin | not_admin

  const firstRender = useRef(true);

  // --- Load all users once ---
  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllRows(data);
    } catch (err) {
      console.error(err);
      toast.error("טעינת המשתמשים נכשלה");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      loadAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Apply filters + sort + paginate (client-side) ---
  useEffect(() => {
    const query = (q || "").trim().toLowerCase();

    const filtered = allRows
      .filter((u) => {
        const email = (u.email || "").toLowerCase();
        const name = (u.displayName || "").toLowerCase();
        const isBlocked = !!u.isBlocked;
        const isAdmin = (u.role || "user") === "admin";

        const matchesSearch =
          !query || email.includes(query) || name.includes(query);

        const matchesBlocked =
          blockedFilter === "all" ||
          (blockedFilter === "blocked" && isBlocked) ||
          (blockedFilter === "not_blocked" && !isBlocked);

        const matchesRole =
          roleFilter === "all" ||
          (roleFilter === "admin" && isAdmin) ||
          (roleFilter === "not_admin" && !isAdmin);

        return matchesSearch && matchesBlocked && matchesRole;
      })
      // sort like your original: createdAt desc
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });

    // keep pageIndex in range
    const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
    const safePageIndex = Math.min(pageIndex, maxPage);

    const start = safePageIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    setPageIndex(safePageIndex);
    setRows(filtered.slice(start, end));
  }, [allRows, q, blockedFilter, roleFilter, pageIndex]);

  const totalFilteredCount = useMemo(() => {
    const query = (q || "").trim().toLowerCase();

    return allRows.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.displayName || "").toLowerCase();
      const isBlocked = !!u.isBlocked;
      const isAdmin = (u.role || "user") === "admin";

      const matchesSearch = !query || email.includes(query) || name.includes(query);

      const matchesBlocked =
        blockedFilter === "all" ||
        (blockedFilter === "blocked" && isBlocked) ||
        (blockedFilter === "not_blocked" && !isBlocked);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && isAdmin) ||
        (roleFilter === "not_admin" && !isAdmin);

      return matchesSearch && matchesBlocked && matchesRole;
    }).length;
  }, [allRows, q, blockedFilter, roleFilter]);

  const hasPrev = pageIndex > 0;
  const hasNext = (pageIndex + 1) * PAGE_SIZE < totalFilteredCount;

  const onPrev = () => {
    if (!hasPrev || loading) return;
    setPageIndex((p) => Math.max(0, p - 1));
  };

  const onNext = () => {
    if (!hasNext || loading) return;
    setPageIndex((p) => p + 1);
  };

  const clearFilters = () => {
    setQ("");
    setBlockedFilter("all");
    setRoleFilter("all");
    setPageIndex(0);
  };

  // --- עדכונים ישירות ב-Firestore ---
  const setRole = async (uid, role) => {
    try {
      await updateDoc(doc(db, "users", uid), { role });
      toast.success("התפקיד עודכן");
      await loadAllUsers(); // refresh data
    } catch (e) {
      console.error(e);
      toast.error("עדכון תפקיד נכשל");
    }
  };
  const toggleBlock = async (uid, current) => {
    try {
      await updateDoc(doc(db, "users", uid), { isBlocked: !current });
      toast.success(!current ? "המשתמש נחסם" : "המשתמש שוחרר");
      await loadAllUsers(); // refresh data
    } catch (e) {
      console.error(e);
      toast.error("עדכון חסימה נכשל");
    }
  };

  return (
    <div className="admin-users p-4 max-w-6xl mx-auto">
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">ניהול משתמשים</h1>
        {/* גרף בגדים מזוהים */}
        <div className="mb-10 border rounded p-4 bg-white">
          <AdminItemsDetectedChart />
        </div>
        <br />

        {/*  Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPageIndex(0);
            }}
            placeholder="חיפוש לפי אימייל או שם משתמש…"
            className="border rounded px-3 py-2 flex-1 min-w-[260px]"
          />

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPageIndex(0);
            }}
            className="border rounded px-3 py-2"
          >
            <option value="all">כל התפקידים</option>
            <option value="admin">מנהלים</option>
            <option value="not_admin">לא מנהלים</option>
          </select>

          <select
            value={blockedFilter}
            onChange={(e) => {
              setBlockedFilter(e.target.value);
              setPageIndex(0);
            }}
            className="border rounded px-3 py-2"
          >
            <option value="all">חסום/לא חסום (הכל)</option>
            <option value="blocked">רק חסומים</option>
            <option value="not_blocked">רק לא חסומים</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="border rounded px-3 py-2"
          >
            ניקוי פילטרים
          </button>

          <div className="text-sm text-gray-600 ms-auto">
            סה"כ משתמשים מוצגים: {totalFilteredCount}
          </div>

        </div>

        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th>אימייל</th>
                <th>תפקיד</th>
                <th>נחסם?</th>
                <th>נוצר</th>
                <th className="actions-col">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.email || "-"}</td>
                  <td className="p-2">{u.role || "user"}</td>
                  <td className="p-2">{u.isBlocked ? "כן" : "לא"}</td>
                  <td className="p-2">
                    {u.createdAt?.toDate
                      ? u.createdAt.toDate().toLocaleString()
                      : "-"}
                  </td>
                  <td className="actions-col">
                    <div className="actions-group">
                      {u.role === "admin" ? (
                        <button
                          type="button"
                          onClick={() => setRole(u.id, "user")}
                          className="px-3 py-1 border rounded"
                          title="הורדה ממנהל"
                        >
                          הורד מנהל
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRole(u.id, "admin")}
                          className="px-3 py-1 border rounded"
                          title="קדם למנהל"
                        >
                          קדם למנהל
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleBlock(u.id, u.isBlocked)}
                        className="px-3 py-1 border rounded"
                        title={u.isBlocked ? "שחרר חסימה" : "חסום משתמש"}
                      >
                        {u.isBlocked ? "הורד חסימה" : "לחסום"}
                      </button>
                      {/* <Link className="px-3 py-1 border rounded" to={`/wardrobe?uid=${u.id}`}>
                        עריכת ארון
                      </Link> */}

                      <Link className="table-action wardrobe-btn" to={`/wardrobe?uid=${u.id}`}>עריכת ארון</Link>

                    </div>
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    אין תוצאות לפי הפילטרים
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={onPrev}
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={!hasPrev || loading}
          >
            ← הקודם
          </button>

          {loading && <span>טוען…</span>}

          <button
            type="button"
            onClick={onNext}
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={!hasNext || loading}
          >
            הבא →
          </button>
        </div>
      </div>
    </div>
  );
}
