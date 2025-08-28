import { useEffect, useState } from "react";
import { initUserProfileIfNeeded, getUserStyle, updateUserStyle } from "../api/UserApi";

const PRESETS = {
  keywords: ["casual","classic","streetwear","boho","elegant","sport","modest","preppy","minimal"],
  dressCodes: ["everyday","work","religious","evening","sport"],
  colors: ["black","white","navy","beige","brown","green","blue","red","yellow","pink","purple","gray"]
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
        await initUserProfileIfNeeded();            // יוצר פרופיל אם אין
        const s = await getUserStyle();             // ← זה במקום getUserProfile()
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
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await updateUserStyle({ bio, keywords, disliked, dressCode, colorsFav, colorsAvoid });
      setMsg("נשמר!");
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  if (loading) return <div>טוען…</div>;

  return (
    <form onSubmit={onSave} className="space-y-4" dir="rtl">
      <label className="d-block mb-2">
        <div className="mb-1">ספר/י על הטעם האופנתי שלך</div>
        <textarea className="form-control" rows={4}
          value={bio} onChange={e=>setBio(e.target.value)} />
      </label>

      <div className="mb-2">
        <div className="mb-1">מאפייני סגנון</div>
        <div className="d-flex flex-wrap gap-2">
          {PRESETS.keywords.map(k =>
            <button type="button" key={k}
              onClick={()=>toggle(keywords,setKeywords,k)}
              className={`btn btn-sm ${keywords.includes(k) ? "btn-primary" : "btn-outline-primary"}`}>
              {k}
            </button>
          )}
        </div>
      </div>

      <div className="mb-2">
        <div className="mb-1">דברים שלא אוהבים</div>
        <input className="form-control"
          placeholder="למשל: סקיני, צהוב"
          value={disliked.join(", ")}
          onChange={e=>setDisliked(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}
        />
      </div>

      <div className="mb-2">
        <div className="mb-1">קוד לבוש עיקרי</div>
        <select className="form-control" value={dressCode ?? ""} onChange={e=>setDressCode(e.target.value || null)}>
          <option value="">(ללא)</option>
          {PRESETS.dressCodes.map(dc => <option value={dc} key={dc}>{dc}</option>)}
        </select>
      </div>

      <div className="mb-2">
        <div className="mb-1">צבעים אהובים</div>
        <div className="d-flex flex-wrap gap-2">
          {PRESETS.colors.map(c =>
            <button type="button" key={c}
              onClick={()=>toggle(colorsFav,setColorsFav,c)}
              className={`btn btn-sm ${colorsFav.includes(c) ? "btn-success" : "btn-outline-success"}`}>
              {c}
            </button>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1">צבעים להימנע</div>
        <div className="d-flex flex-wrap gap-2">
          {PRESETS.colors.map(c =>
            <button type="button" key={c}
              onClick={()=>toggle(colorsAvoid,setColorsAvoid,c)}
              className={`btn btn-sm ${colorsAvoid.includes(c) ? "btn-danger" : "btn-outline-danger"}`}>
              {c}
            </button>
          )}
        </div>
      </div>

      <button className="btn btn-dark">שמור/י</button>
      {msg && <div className="text-success mt-2">{msg}</div>}
      {err && <div className="text-danger mt-2">{err}</div>}
    </form>
  );
}
