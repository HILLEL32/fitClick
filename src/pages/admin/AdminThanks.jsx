import { Link } from "react-router-dom";

export default function AdminThanks() {
  return (
    <div style={{ maxWidth: 720, margin: "64px auto", textAlign: "center" }} dir="rtl">
      <h2>הבקשה נשלחה</h2>
      <p>בקשתך להירשם כמנהל נשלחה לבדיקה. לאחר אישור תקבלי/תקבל גישה מלאה לממשק המנהלים.</p>
      <p>בינתיים אפשר לחזור לעמוד הבית או להיכנס עם המשתמש החדש.</p>
      <div style={{ marginTop: 16 }}>
        <Link to="/">חזרה לעמוד הבית</Link>
      </div>
    </div>
  );
}
