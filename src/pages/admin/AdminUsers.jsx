import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }} dir="rtl">
      <h2>רשימת משתמשים</h2>
      {users.length === 0 ? (
        <p>לא נמצאו משתמשים.</p>
      ) : (
        <table border="1" cellPadding="8" width="100%">
          <thead>
            <tr>
              <th>שם</th>
              <th>אימייל</th>
              <th>תפקיד</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.displayName || "—"}</td>
                <td>{u.email}</td>
                <td>{u.role || "user"}</td>
                <td>
                  <Link to={`/admin/users/${u.id}/wardrobe`}>עריכת ארון</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
