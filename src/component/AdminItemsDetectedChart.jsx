import { useEffect, useMemo, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";



function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function last7Days() {
  const days = []; const today = startOfDay(new Date());
  for (let i = 6; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); days.push(d); }
  return days;
}
function toKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

export default function AdminItemsDetectedChart({ onlyUid }) {
  const [data, setData] = useState([]);
  const since = useMemo(() => { const d = new Date(); d.setDate(d.getDate()-6); d.setHours(0,0,0,0); return d; }, []);

  useEffect(() => {
    (async () => {
      const perDay = new Map();
      const collectionsToScan = ["clothing", "clothingItems"]; // אם תרצי רק אחת – השאירי רק אותה

      for (const colName of collectionsToScan) {
        const colRef = collection(db, colName);
        const clauses = [where("createdAt", ">=", since), orderBy("createdAt", "asc")];
        if (onlyUid) clauses.unshift(where("uid", "==", onlyUid));
        const snap = await getDocs(query(colRef, ...clauses));

        for (const doc of snap.docs) {
          const ts = doc.data()?.createdAt?.toDate?.();
          if (!ts) continue;
          const key = toKey(startOfDay(ts));
          perDay.set(key, (perDay.get(key) || 0) + 1);
        }
      }

      const rows = last7Days().map(d => ({ day: toKey(d), count: perDay.get(toKey(d)) || 0 }));
      setData(rows);
    })();
  }, [since, onlyUid]);

  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3 style={{ marginBottom: 12 }}>  זיהוי בגדים כולל פר יום
</h3>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#B5693A"  strokeWidth={3}   activeDot={{ r: 5 }}
 />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
