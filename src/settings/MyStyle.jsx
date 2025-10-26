// src/pages/MyStyle.jsx
import { useEffect, useState } from "react";
import {
  initUserProfileIfNeeded,
  getUserStyle,
  updateUserStyle,
} from "../api/UserApi";
import "../css/MyStyle.css";

/* --- מיפויי תצוגה בעברית (לתוויות) --- */
const COLOR_LABEL = {
  black: "שחור",
  white: "לבן",
  navy: "כחול כהה",
  beige: "בז'",
  brown: "חום",
  green: "ירוק",
  blue: "כחול",
  red: "אדום",
  yellow: "צהוב",
  pink: "ורוד",
  purple: "סגול",
  gray: "אפור",
};

const KEYWORD_LABEL = {
  casual: "יומיומי",
  classic: "קלאסי",
  streetwear: "אופנת רחוב",
  boho: "בוהו",
  elegant: "אלגנטי",
  sport: "ספורטיבי",
  modest: "צנוע",
  preppy: "מתוקתק",
  minimal: "מינימליסטי",
};

const DRESSCODE_LABEL = {
  everyday: "יומיומי",
  work: "לעבודה",
  religious: "דתי / צנוע",
  evening: "ערב / אלגנטי",
  sport: "ספורטיבי",
};

const PRESETS = {
  keywords: Object.keys(KEYWORD_LABEL),
  dressCodes: Object.keys(DRESSCODE_LABEL),
  colors: Object.keys(COLOR_LABEL),
};

export default function MyStyle() {
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [disliked, setDisliked] = useState([]);
  const [dressCode, setDressCode] = useState(null); // נשמר באנגלית
  const [colorsFav, setColorsFav] = useState([]);   // נשמר באנגלית
  const [colorsAvoid, setColorsAvoid] = useState([]); // נשמר באנגלית
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await initUserProfileIfNeeded();
        const s = await getUserStyle();

        // --- המרות לאחור אם נשמרו בעברית בעבר ---
        const inv = (obj) =>
          Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
        const INV_COLOR = inv(COLOR_LABEL);
        const INV_KEYWORD = inv(KEYWORD_LABEL);
        const INV_DRESS = inv(DRESSCODE_LABEL);

        const mapArr = (arr, invMap) =>
          Array.isArray(arr) ? arr.map((x) => invMap[x] || x) : [];
        const mapOne = (val, invMap) => (val ? invMap[val] || val : null);

        setBio(s.bio || "");
        setKeywords(mapArr(s.keywords || [], INV_KEYWORD));   // → אנגלית
        setDisliked(s.disliked || []);                        // טקסט חופשי
        setDressCode(mapOne(s.dressCode ?? null, INV_DRESS)); // → אנגלית
        setColorsFav(mapArr(s.colorsFav || [], INV_COLOR));   // → אנגלית
        setColorsAvoid(mapArr(s.colorsAvoid || [], INV_COLOR));
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // toggle פונקציונלי
  const toggle = (setArr, v) =>
    setArr((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await updateUserStyle({
        bio,
        keywords,     // באנגלית
        disliked,
        dressCode,    // באנגלית
        colorsFav,    // באנגלית
        colorsAvoid,  // באנגלית
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
          {PRESETS.keywords.map((k) => {
            const on = keywords.includes(k);
            return (
              <button
                type="button"
                key={k}
                onClick={() => toggle(setKeywords, k)}
                aria-pressed={on}
                className={`chip ${on ? "chip--on" : ""}`}
                title={KEYWORD_LABEL[k]}
              >
                {KEYWORD_LABEL[k]}
              </button>
            );
          })}
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
                {DRESSCODE_LABEL[dc]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* צבעים אהובים */}
      <div className="mystyle-section">
        <div className="mystyle-label">צבעים אהובים</div>
        <div className="chip-row">
          {PRESETS.colors.map((c) => {
            const on = colorsFav.includes(c);
            return (
              <button
                type="button"
                key={c}
                onClick={() => toggle(setColorsFav, c)}
                aria-pressed={on}
                className={`chip chip--color ${on ? "chip--on" : ""}`}
                data-color={c}
                title={COLOR_LABEL[c]}
              >
                {COLOR_LABEL[c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* צבעים להימנע */}
      <div className="mystyle-section">
        <div className="mystyle-label">צבעים להימנע</div>
        <div className="chip-row">
          {PRESETS.colors.map((c) => {
            const on = colorsAvoid.includes(c);
            return (
              <button
                type="button"
                key={c}
                onClick={() => toggle(setColorsAvoid, c)}
                aria-pressed={on}
                className={`chip chip--avoid ${on ? "chip--on" : ""}`}
                data-color={c}
                title={COLOR_LABEL[c]}
              >
                {COLOR_LABEL[c]}
              </button>
            );
          })}
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
