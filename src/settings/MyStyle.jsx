// src/pages/MyStyle.jsx  (או איפה שאצלך)
// שמרי את הלוגיקה כמו שהיא — רק עטפתי בעיצוב ותתי־קומפוננטות קטנות
import { useEffect, useState } from "react";
import {
  initUserProfileIfNeeded,
  getUserStyle,
  updateUserStyle,
} from "../api/UserApi";
import "../css/MyStyle.css";

const PRESETS = {
  keywords: [
    "casual",
    "classic",
    "streetwear",
    "boho",
    "elegant",
    "sport",
    "modest",
    "preppy",
    "minimal",
  ],
  dressCodes: ["everyday", "work", "religious", "evening", "sport"],
  colors: [
    "black",
    "white",
    "navy",
    "beige",
    "brown",
    "green",
    "blue",
    "red",
    "yellow",
    "pink",
    "purple",
    "gray",
  ],
};

export default function MyStyle() {
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [disliked, setDisliked] = useState([]);
  const [dressCode, setDressCode] = useState(null);
  const [colorsFav, setColorsFav] = useState([]);
  const [colorsAvoid, setColorsAvoid] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await initUserProfileIfNeeded();
        const s = await getUserStyle();
        setBio(s.bio || "");
        setKeywords(s.keywords || []);
        setDisliked(s.disliked || []);
        setDressCode(s.dressCode ?? null);
        setColorsFav(s.colorsFav || []);
        setColorsAvoid(s.colorsAvoid || []);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (arr, setArr, v) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await updateUserStyle({
        bio,
        keywords,
        disliked,
        dressCode,
        colorsFav,
        colorsAvoid,
      });
      setMsg("נשמר!");
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  if (loading) return <div className="style-loader">טוען…</div>;

  return (
    <form onSubmit={onSave} className="mystyle wrapper glass-card" dir="rtl">
      {/* כותרת קטנה + הסבר */}
      <div className="mystyle-head">
        <h4 className="mystyle-title">כרטיס סגנון אישי</h4>
        <p className="mystyle-sub">
          זה המקום לתאר את הוייב שלך, לבחור מאפייני סגנון, וקודים/צבעים מועדפים.
        </p>
      </div>

      {/* ביוגרפיה/טעם */}
      <div className="mystyle-section">
        <label className="mystyle-label">ספר/י על הטעם האופנתי שלך</label>
        <textarea
          className="form-control fc-input mystyle-textarea"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="למשל: אוהב/ת בסיסי עם נגיעות ורודות, מחפש/ת לוקים לעבודה ויציאה..."
        />
      </div>

      {/* מאפייני סגנון */}
      <div className="mystyle-section">
        <div className="mystyle-label">מאפייני סגנון</div>
        <div className="chip-row">
          {PRESETS.keywords.map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => toggle(keywords, setKeywords, k)}
              className={`chip ${keywords.includes(k) ? "chip--on" : ""}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* דברים שלא אוהבים */}
      <div className="mystyle-section">
        <div className="mystyle-label">דברים שלא אוהבים</div>
        <input
          className="form-control fc-input"
          placeholder="למשל: סקיני, צהוב"
          value={disliked.join(", ")}
          onChange={(e) =>
            setDisliked(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      </div>

      {/* קוד לבוש */}
      <div className="mystyle-section">
        <div className="mystyle-label">קוד לבוש עיקרי</div>
        <div className="chip-row chip-row--select">
          <select
            className="form-control fc-input mystyle-select"
            value={dressCode ?? ""}
            onChange={(e) => setDressCode(e.target.value || null)}
          >
            <option value="">(ללא)</option>
            {PRESETS.dressCodes.map((dc) => (
              <option value={dc} key={dc}>
                {dc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* צבעים אהובים */}
      <div className="mystyle-section">
        <div className="mystyle-label">צבעים אהובים</div>
        <div className="chip-row">
          {PRESETS.colors.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggle(colorsFav, setColorsFav, c)}
              className={`chip chip--color ${
                colorsFav.includes(c) ? "chip--on" : ""
              }`}
              data-color={c}
              title={c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* צבעים להימנע */}
      <div className="mystyle-section">
        <div className="mystyle-label">צבעים להימנע</div>
        <div className="chip-row">
          {PRESETS.colors.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggle(colorsAvoid, setColorsAvoid, c)}
              className={`chip chip--avoid ${
                colorsAvoid.includes(c) ? "chip--on" : ""
              }`}
              data-color={c}
              title={c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* שמירה + הודעות */}
      <div className="mystyle-actions">
        <button className="fc-btn fc-btn--two" type="submit">
          שמור/י
        </button>
        {msg && <div className="mystyle-msg ok">{msg}</div>}
        {err && <div className="mystyle-msg err">{err}</div>}
      </div>
    </form>
  );
}
