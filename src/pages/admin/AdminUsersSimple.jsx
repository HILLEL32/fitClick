import { useEffect, useState, useMemo } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export default function AdminUsersSimple() {
  const db = useMemo(() => getFirestore(), []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        // קורא את *כל* המסמכים בקולקציה users
        const snap = await getDocs(collection(db, "users"));
        setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setErr(e.message || "Permission denied / בעיית הרשאות");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [db]);

  if (loading) return <div style={{padding:16}}>טוען נתונים…</div>;
  if (err) return <div style={{padding:16, color:"#b00"}}>שגיאה: {err}</div>;

  return (
    <div style={{padding:16, maxWidth:900, margin:"0 auto"}}>
      <h1 style={{fontSize:24, marginBottom:12}}>ניהול משתמשים</h1>
      <div style={{overflowX:"auto", border:"1px solid #eee", borderRadius:8}}>
        <table style={{width:"100%", fontSize:14, borderCollapse:"collapse"}}>
          <thead style={{background:"#f6f6f6"}}>
            <tr>
              <th style={{textAlign:"right", padding:8}}>שם</th>
              <th style={{textAlign:"right", padding:8}}>אימייל</th>
              <th style={{textAlign:"right", padding:8}}>תפקיד</th>
              <th style={{textAlign:"right", padding:8}}>נחסם?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} style={{borderTop:"1px solid #eee"}}>
                <td style={{padding:8}}>{u.displayName || "-"}</td>
                <td style={{padding:8}}>{u.email || "-"}</td>
                <td style={{padding:8}}>{u.role || "user"}</td>
                <td style={{padding:8}}>{u.isBlocked ? "כן" : "לא"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} style={{padding:16, textAlign:"center", color:"#777"}}>אין משתמשים</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
