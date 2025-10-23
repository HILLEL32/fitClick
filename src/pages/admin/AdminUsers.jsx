// src/pages/admin/AdminUsers.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getFirestore, collection, query, orderBy, limit, startAfter, getDocs, where,
  doc, updateDoc
} from "firebase/firestore";
import { toast } from "react-toastify";
import '../../css/AdminUsers.css';

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const db = useMemo(() => getFirestore(), []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageStack, setPageStack] = useState([]); // קורסורים ל"עמוד קודם"
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState("");
  const firstRender = useRef(true);

  const fetchPage = async (direction = "init") => {
    setLoading(true);
    try {
      const colRef = collection(db, "users");
      let q;

      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const end = s.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
        q = query(
          colRef,
          orderBy("emailLower"),
          where("emailLower", ">=", s),
          where("emailLower", "<", end),
          limit(PAGE_SIZE + 1)
        );
      } else {
        q = query(
          colRef,
          orderBy("createdAt", "desc"),
          ...(cursor ? [startAfter(cursor)] : []),
          limit(PAGE_SIZE + 1)
        );
      }

      const snap = await getDocs(q);
      const docs = snap.docs.slice(0, PAGE_SIZE);
      setRows(docs.map(d => ({ id: d.id, ...d.data() })));
      setHasNext(snap.docs.length > PAGE_SIZE);

      if (docs.length > 0) {
        const last = docs[docs.length - 1];
        setCursor(last);
        if (direction === "init") setPageStack([last]);
        if (direction === "next") setPageStack(prev => [...prev, last]);
      } else {
        setCursor(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("טעינת המשתמשים נכשלה");
    } finally {
      setLoading(false);
    }
  };

  const onNext = () => {
    if (!hasNext || loading) return;
    fetchPage("next");
  };

  const onPrev = async () => {
    if (pageStack.length <= 1 || loading) return;
    const newStack = [...pageStack];
    newStack.pop();
    setPageStack(newStack);
    setCursor(newStack[newStack.length - 1] ?? null);
    await fetchPage("prev");
  };

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      fetchPage("init");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    setCursor(null);
    setPageStack([]);
    await fetchPage("init");
  };

  // --- עדכונים ישירות ב-Firestore ---
  const setRole = async (uid, role) => {
    try {
      await updateDoc(doc(db, "users", uid), { role });
      toast.success("התפקיד עודכן");
      await fetchPage("init");
    } catch (e) {
      console.error(e);
      toast.error("עדכון תפקיד נכשל");
    }
  };

  const toggleBlock = async (uid, current) => {
    try {
      await updateDoc(doc(db, "users", uid), { isBlocked: !current });
      toast.success(!current ? "המשתמש נחסם" : "המשתמש שוחרר");
      await fetchPage("init");
    } catch (e) {
      console.error(e);
      toast.error("עדכון חסימה נכשל");
    }
  };

  return (
    <div className="admin-users p-4 max-w-6xl mx-auto">

    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">ניהול משתמשים</h1>

      {/* <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי אימייל"
          className="border rounded px-3 py-2 flex-1"
        />
        <button className="bg-black text-white px-4 py-2 rounded">חפש</button>
      </form> */}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-right p-2">אימייל</th>
              <th className="text-right p-2">תפקיד</th>
              <th className="text-right p-2">נחסם?</th>
              <th className="text-right p-2">נוצר</th>
              <th className="text-right p-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.email || "-"}</td>
                <td className="p-2">{u.role || "user"}</td>
                <td className="p-2">{u.isBlocked ? "כן" : "לא"}</td>
                <td className="p-2">{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString() : "-"}</td>
                <td className="p-2">
                  <div className="flex gap-2">
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
                      {u.isBlocked ? "הורד חסימה" : "חסום"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">אין נתונים</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
          {/* <button
            type="button"
            onClick={onPrev}
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={pageStack.length <= 1 || loading}
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
          </button> */}
      </div>
    </div>
    </div>

  );
}
