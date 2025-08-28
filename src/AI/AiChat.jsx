// src/AI/AiChat.jsx
import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/firebase";
import { askOpenAI } from "../AI/askOpenAI.jsx";
import { getWardrobe } from "../api/wardrobeApi";
import { getUserStyle } from "../api/UserApi";
import { useLocation } from "react-router-dom";

// === Helpers (module-scope) ===

// זיהוי עונה מתוך טקסט בקשה
const inferSeasonFromPrompt = (t) => {
  const s = (t || "").toLowerCase();
  // עברית
  if (/[חח]ורף|גשם|קר|סערה|שלג/.test(s)) return "winter";
  if (/קיץ|חם|לחות|שמש/.test(s)) return "summer";
  if (/סתיו|עלים|רוח קלה/.test(s)) return "autumn";
  if (/אביב|פריחה|מעבר/.test(s)) return "spring";
  // אנגלית
  if (/winter|cold|rain/.test(s)) return "winter";
  if (/summer|hot|heat/.test(s)) return "summer";
  if (/autumn|fall/.test(s)) return "autumn";
  if (/spring/.test(s)) return "spring";
  return null;
};

// זיהוי עונה לפי חודש (fallback כללי)
const getCurrentSeason = () => {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "אביב";
  if (month >= 5 && month <= 7) return "קיץ";
  if (month >= 8 && month <= 10) return "סתיו";
  return "חורף";
};

// מיפוי צבעים/פריטים בעברית -> אנגלית (לדרישות הצבע/סוג מהמשתמש)
const COLOR_MAP = {
  "לבן": "white", "לבנה": "white", "לבנים": "white",
  "שחור": "black", "שחורה": "black", "שחורים": "black",
  "אדום": "red", "אדומה": "red", "אדומים": "red",
  "כחול": "blue", "כחולה": "blue", "כחולים": "blue",
  "ירוק": "green", "ירוקה": "green", "ירוקים": "green",
  "ורוד": "pink", "ורודה": "pink", "ורודים": "pink",
  "צהוב": "yellow", "צהובה": "yellow", "צהובים": "yellow",
  "אפור": "gray", "אפורה": "gray", "אפורים": "gray",
  "חום": "brown", "חומה": "brown", "חומים": "brown",
  "כהים": "dark", "כהה": "dark",
  "בהירים": "light", "בהיר": "light", "בהירה": "light"
};

const ITEM_MAP = {
  "חולצה": "shirt", "חולצות": "shirt",
  "מכנסיים": "pants", "מכנס": "pants",
  "חצאית": "skirt", "חצאיות": "skirt",
  "שמלה": "dress", "שמלות": "dress",
  "ג׳קט": "jacket", "ג'קט": "jacket", "מעיל": "jacket",
  "כובע": "hat", "כובעים": "hat",
  "נעליים": "shoes", "נעל": "shoes",
  "סוודר": "sweater", "סריג": "sweater", "קפוצ׳ון": "hoodie", "קפוצ'ון": "hoodie"
};

// פירוק בקשת המשתמש לדרישות (צבעים/פריטים/סגנונות)
const parseUserRequest = (text) => {
  const requirements = { colors: [], items: [], styles: [], occasions: [] };
  Object.keys(COLOR_MAP).forEach((he) => {
    if ((text || "").includes(he)) requirements.colors.push(COLOR_MAP[he]);
  });
  Object.keys(ITEM_MAP).forEach((he) => {
    if ((text || "").includes(he)) requirements.items.push(ITEM_MAP[he]);
  });
  return requirements;
};

// נרמול ערכים למערך
const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// קלאסיפיקציה של פריט לעוגן → לאיזה slot הוא שייך
const classifySlot = (item) => {
  const types = toArr(item?.type).map(t => String(t).toLowerCase());
  const has = (...keys) => types.some(a => keys.some(k => a.includes(k)));

  if (has("dress")) return "top"; // שמלה תופסת top ומבטלת bottom
  if (has("jacket","coat","cardigan","blazer","overcoat")) return "outerwear";
  if (has("shirt","top","blouse","t-shirt","tee","hoodie","sweater")) return "top";
  if (has("pants","jeans","trousers","skirt","shorts","chinos")) return "bottom";
  if (has("shoes","sneakers","heels","boots","sandals")) return "shoes";
  if (has("hat","cap","beanie","beret","headscarf","kippah","kipah")) return "headwear";
  return "extras";
};

// === Component ===
export default function AiChat({ anchorItemId: anchorFromProps }) {
  const [wardrobe, setWardrobe] = useState([]);
  const [prompt, setPrompt] = useState("חולצה לבנה עם מכנסיים כהים לעבודה");
  const [loadingWardrobe, setLoadingWardrobe] = useState(true);
  const [answerRaw, setAnswerRaw] = useState("");
  const [picked, setPicked] = useState(null);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [err, setErr] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai-gpt4o-mini");
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [style, setStyle] = useState(null);
  const [anchorItemId, setAnchorItemId] = useState(null);

  const location = useLocation?.();

  const availableModels = [
    { id: "openai-gpt4o-mini", name: "OpenAI GPT-4o Mini (מומלץ)", api: "openai" }
  ];

  const getImageDataUrl = (item) =>
    item?.imageId ? localStorage.getItem(item.imageId) : null;

  // ========== useEffect 1: טעינת הארון ==========
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoadingWardrobe(true);
        const user = auth.currentUser;
        if (!user) {
          setErr("לא נמצא משתמש מחובר.");
          setWardrobe([]);
          return;
        }
        const items = await getWardrobe(user.uid);
        setWardrobe(items || []);
      } catch (e) {
        setErr("שגיאה בטעינת הארון: " + (e?.message || e));
      } finally {
        setLoadingWardrobe(false);
      }
    })();
  }, []);

  // ========== useEffect 2: טעינת סגנון משתמש ==========
  useEffect(() => {
    (async () => {
      try {
        const s = await getUserStyle();
        setStyle(s || null);
      } catch (e) {
        console.warn("Load style failed:", e);
      }
    })();
  }, []);

  // ========== useEffect 3: קריאת anchor (פרופס או query) ==========
  useEffect(() => {
    if (anchorFromProps) setAnchorItemId(anchorFromProps);
  }, [anchorFromProps]);

  useEffect(() => {
    if (!location) return;
    const p = new URLSearchParams(location.search);
    const qAnchor = p.get("anchor");
    if (qAnchor) setAnchorItemId(qAnchor);
  }, [location]);

  // מילון מהיר id -> item
  const byId = useMemo(() => {
    const m = {};
    for (const it of wardrobe) m[it.id] = it;
    return m;
  }, [wardrobe]);

  // אם נכנסנו עם anchor – מלא אוטומטית prompt נוח
  useEffect(() => {
    if (anchorItemId && byId[anchorItemId]) {
      const it = byId[anchorItemId];
      const role = classifySlot(it);
      const niceName = (toArr(it.type)[0] || "פריט");
      setPrompt(`התאם לוק שלם סביב ${niceName} (id=${it.id}) לעבודה/יציאה לפי הצורך, עם התאמת צבעים מדויקת. הוסף נעליים/כובע רק אם זה משפר את הסט.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorItemId, byId]);

  // סיכום סגנון המשתמש לטובת הפרומפט
  const styleSummary = useMemo(() => {
    if (!style) return "(no explicit user style)";
    return `
UserStyle:
- Bio: ${style.bio || "-"}
- Keywords: ${(style.keywords || []).join(", ") || "-"}
- DressCode: ${style.dressCode || "-"}
- Likes colors: ${(style.colorsFav || []).join(", ") || "-"}
- Avoid colors: ${(style.colorsAvoid || []).join(", ") || "-"}
- Disliked: ${(style.disliked || []).join(", ") || "-"}
`.trim();
  }, [style]);

  // בניית פרומפט משופר (כולל כובע+נעליים ועוגן)
  const buildPrompt = () => {
    const requestedSeason = inferSeasonFromPrompt(prompt);
    const currentSeason = getCurrentSeason();
    const compact = wardrobe.map((it) => ({
      id: it.id,
      type: toArr(it.type),
      colors: toArr(it.colors),
      style: toArr(it.style),
      gender: it.gender || null,
      length: toArr(it.length),
    }));

    const userRequirements = parseUserRequest(prompt);

    // עוגן (אם יש)
    let anchor = null;
    if (anchorItemId && byId[anchorItemId]) {
      const it = byId[anchorItemId];
      anchor = { id: it.id, slotHint: classifySlot(it) };
    }

    return `
את/ה סטייליסט/ית ישראלי/ת דובר/ת עברית. החזר/י אך ורק JSON תקין לפי הסכימה.

חוקי צבע (חשוב מאוד):
1) אם המשתמש ביקש צבעים מפורשים, התאימי בדיוק. אין להחליף בצבע "דומה".
2) אם צבע נדרש לא קיים בארון – החזר/י null בסלוט הרלוונטי והסבר/י בקצרה.
3) התאמת צבעים גוברת על התאמת סגנון.

חוקי עונות:
- יש שדה requestedSeason (winter/summer/autumn/spring). אם קיים – הוא מחייב.
- אם לא קיים, אפשר לשקול את העונה הנוכחית באופן רופף: "${currentSeason}".

מיפוי עונות להעדפות:
- winter: coat, jacket, sweater, hoodie, cardigan, turtleneck, wool pants, boots, scarf, beanie, gloves.
- summer: t-shirt, tank top, short-sleeve shirt, light blouse, shorts, light skirt, linen/cotton, sandals.
- autumn: light jacket/cardigan, long-sleeve shirt, jeans/chinos, closed shoes.
- spring: light layers, blouse, midi skirt, breathable fabrics.

אילוצים:
- אין לשלב "sport" עם "elegant" אלא אם המשימה דורשת.
- השתמש/י אך ורק ב-IDs שקיימים ב-wardrobe.

${styleSummary}

Wardrobe:
${JSON.stringify(compact)}

Task (בקשת המשתמש):
${prompt}

User requirements (parsed):
colors: ${JSON.stringify(userRequirements.colors)}
items: ${JSON.stringify(userRequirements.items)}

requestedSeason:
${JSON.stringify(requestedSeason)}

${anchor ? `Anchor (חייב להיכלל בהרכב):
- id: "${anchor.id}"
- slotHint: "${anchor.slotHint}"
אם העוגן הוא "dress" אין לבחור bottom.
` : ""}

פלט נדרש – JSON בלבד בסכימה:
{
  "selected": {
    "top": "<id or null>",
    "bottom": "<id or null>",
    "headwear": "<id or null>",
    "outerwear": "<id or null>",
    "shoes": "<id or null>",
    "extras": ["<id>", "..."]
  },
  "reason": "הסבר קצר בעברית (3–5 משפטים) על בחירת הפריטים, התאמת צבעים ועונה.",
  "confidence": 0.85,
  "colorMatch": "perfect|partial|none",
  "missingItems": ["רשימת פריטים/צבעים שביקש המשתמש ולא נמצאו"]
}

בחר/י shoes/headwear רק אם הם משפרים את הסט (אחרת החזר/י null).
אם אין התאמה טובה לעונה או לצבע – החזר/י null בסלוט הרלוונטי והסבר/י.
החזר/י JSON תקין בלבד, ללא Markdown או טקסט נוסף מחוץ ל-JSON.
`.trim();
  };

  // פענוח תשובה וחילוץ JSON (כולל shoes)
  const parseAndValidateResponse = (text) => {
    try {
      let jsonStr = text;

      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
          jsonStr = text.slice(start, end + 1);
        }
      }

      const parsed = JSON.parse(jsonStr);

      if (!parsed.selected || typeof parsed.reason !== "string") {
        console.warn("Invalid response structure:", parsed);
        return null;
      }

      const keepId = (x) => (x && byId[x] ? x : null);
      const keepIds = (arr) => (Array.isArray(arr) ? arr.filter((x) => byId[x]) : []);

      const cleaned = {
        ...parsed,
        selected: {
          top: keepId(parsed.selected?.top),
          bottom: keepId(parsed.selected?.bottom),
          headwear: keepId(parsed.selected?.headwear),
          outerwear: keepId(parsed.selected?.outerwear),
          shoes: keepId(parsed.selected?.shoes),
          extras: keepIds(parsed.selected?.extras || parsed.selected?.accessories || []),
        },
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        colorMatch: parsed.colorMatch || "unknown",
        missingItems: Array.isArray(parsed.missingItems) ? parsed.missingItems : [],
      };

      return cleaned;
    } catch (error) {
      console.error("Failed to parse response:", error);
      console.log("Raw text:", text);
      return null;
    }
  };

  // בדיקות אזהרה מול דרישות המשתמש (וצ’ק לעוגן)
  const validateResponse = (response, userRequirements) => {
    const warnings = [];
    if (!response?.selected) return ["לא נבחרו פריטים"];

    const selectedItems = [];
    Object.entries(response.selected).forEach(([slot, id]) => {
      if (id && byId[id]) {
        selectedItems.push({ item: byId[id], slot });
      } else if (Array.isArray(id)) {
        id.forEach((itemId) => {
          if (itemId && byId[itemId]) selectedItems.push({ item: byId[itemId], slot: "extras" });
        });
      }
    });

    // התאמת צבע
    userRequirements.colors.forEach((requiredColor) => {
      const hasColor = selectedItems.some(
        ({ item }) =>
          item.colors &&
          item.colors.some((c) => {
            const a = String(c || "").toLowerCase();
            const b = String(requiredColor || "").toLowerCase();
            return a === b || a.includes(b) || b.includes(a);
          })
      );
      if (!hasColor && selectedItems.length > 0) {
        warnings.push(`ה-AI לא בחר פריט בצבע "${requiredColor}" למרות שביקשת.`);
      }
    });

    // דרישת פריט מסוג מסוים
    userRequirements.items.forEach((requiredItem) => {
      const hasItem = selectedItems.some(
        ({ item }) =>
          item.type &&
          item.type.some((t) => {
            const a = String(t || "").toLowerCase();
            const b = String(requiredItem || "").toLowerCase();
            return a === b || a.includes(b) || b.includes(a);
          })
      );
      if (!hasItem && selectedItems.length > 0) {
        warnings.push(`ה-AI לא בחר "${requiredItem}" כמו שביקשת.`);
      }
    });

    // אימות עוגן
    if (anchorItemId) {
      const mustId = anchorItemId;
      const appearsIn =
        response.selected.top === mustId ||
        response.selected.bottom === mustId ||
        response.selected.headwear === mustId ||
        response.selected.outerwear === mustId ||
        response.selected.shoes === mustId ||
        (Array.isArray(response.selected.extras) && response.selected.extras.includes(mustId));

      if (!appearsIn) {
        warnings.push("⚠️ הפריט שנבחר כעוגן לא שובץ בסט כפי שהתבקש.");
      }
    }

    return warnings;
  };

  // בחירת מודל והרצה (OpenAI בלבד)
  const askModel = async (p) => {
    return await askOpenAI(p);
  };

  // שליחה למודל
  const onAsk = async () => {
    setErr("");
    setAnswerRaw("");
    setPicked(null);
    setValidationWarnings([]);
    setLoadingAsk(true);

    try {
      const userRequirements = parseUserRequest(prompt);
      const fullPrompt = buildPrompt();
      let text = "";
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          text = await askModel(fullPrompt);
          const parsed = parseAndValidateResponse(text);
          if (parsed && parsed.reason) {
            setAnswerRaw(text);
            const warnings = validateResponse(parsed, userRequirements);
            setValidationWarnings(warnings);
            setPicked(parsed);
            break;
          }
          if (retryCount < maxRetries) {
            retryCount++;
            continue;
          }
        } catch (e) {
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          throw e;
        }
      }

      if (!text) {
        setErr("המודל לא החזיר תשובה תקינה אחרי מספר ניסיונות.");
      }
    } catch (e) {
      setErr("שגיאה בשליחת הבקשה: " + (e?.message || e));
    } finally {
      setLoadingAsk(false);
    }
  };

  return (
    <div className="container mt-5" dir="rtl">
      <h2 className="mb-4 text-center">יועץ האופנה החכם</h2>

      {/* בחירת מודל */}
      <div className="mb-3">
        <label className="form-label">בחר מודל AI:</label>
        <select
          className="form-control"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={loadingAsk}
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {/* קלט המשתמש */}
      <div className="mb-3">
        <label className="form-label">מה תרצה שה-AI יתאים לך?</label>
        <input
          type="text"
          className="form-control"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="לדוגמה: לוק חורפי לעבודה: חולצה לבנה ומכנס כהה"
          disabled={loadingAsk}
        />
        <div className="form-text">
          טיפ: ציין צבעים ספציפיים ועונה (למשל: “לוק חורפי / קייצי”) לקבלת התאמה טובה יותר.
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={onAsk}
        disabled={loadingAsk || loadingWardrobe || wardrobe.length === 0}
      >
        {loadingAsk ? "מבקש מה-AI..." : "בקש לוק מהארון שלי"}
      </button>

      {/* סטטוסים */}
      {loadingWardrobe && <div className="mt-3">טוען את הארון...</div>}
      {err && <div className="alert alert-danger mt-3">{err}</div>}
      {!loadingWardrobe && wardrobe.length === 0 && !err && (
        <div className="alert alert-warning mt-3">לא נמצאו פריטים בארון שלך.</div>
      )}

      {/* אזהרות ולידציה */}
      {validationWarnings.length > 0 && (
        <div className="alert alert-warning mt-3">
          <strong>⚠️ שים לב:</strong>
          <ul className="mb-0 mt-2">
            {validationWarnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* תשובה גולמית (דיבוג) */}
      {answerRaw && (
        <details className="mt-3">
          <summary>תשובת AI גולמית (לדיבוג)</summary>
          <pre className="p-2 bg-light border rounded" style={{ whiteSpace: "pre-wrap" }}>
            {answerRaw}
          </pre>
        </details>
      )}

      {/* תצוגת הסט שנבחר */}
      {picked && (
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>הסט שנבחר:</h5>
            <div className="d-flex gap-2">
              {picked.confidence !== undefined && (
                <span className="badge bg-info">
                  ביטחון: {Math.round(picked.confidence * 100)}%
                </span>
              )}
              {picked.colorMatch && (
                <span
                  className={`badge ${
                    picked.colorMatch === "perfect"
                      ? "bg-success"
                      : picked.colorMatch === "partial"
                      ? "bg-warning"
                      : "bg-danger"
                  }`}
                >
                  התאמת צבעים: {picked.colorMatch}
                </span>
              )}
            </div>
          </div>

          <div className="row">
            {Object.entries(picked.selected)
              .filter(([slot, id]) => slot !== "extras" && id && byId[id])
              .map(([slot, id]) => {
                const item = byId[id];
                return (
                  <div className="col-md-3 mb-3" key={slot}>
                    <div className="card h-100">
                      <div className="card-header text-center">
                        <strong>{slot}</strong>
                      </div>
                      <div className="card-body text-center">
                        {getImageDataUrl(item) ? (
                          <img
                            src={getImageDataUrl(item)}
                            alt={slot}
                            className="img-fluid rounded mb-2"
                            style={{
                              width: 160,
                              height: 160,
                              objectFit: "cover",
                              border: "2px solid #dee2e6",
                            }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center bg-light rounded mb-2"
                            style={{ width: 160, height: 160 }}
                          >
                            <span className="text-muted">אין תמונה</span>
                          </div>
                        )}
                        <div className="small">
                          <div><strong>סוג:</strong> {(item.type || []).join(", ") || "—"}</div>
                          <div><strong>צבעים:</strong> {(item.colors || []).join(", ") || "—"}</div>
                          <div><strong>סגנון:</strong> {(item.style || []).join(", ") || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Extras */}
          {picked.selected?.extras && picked.selected.extras.length > 0 && (
            <div className="mt-3">
              <h6>אקססוריז נוספים:</h6>
              <div className="ד-flex flex-wrap gap-2">
                {picked.selected.extras.map((id) => {
                  const item = byId[id];
                  if (!item) return null;
                  const url = getImageDataUrl(item);
                  return (
                    <div key={id} className="border rounded p-2 text-center">
                      {url ? (
                        <img
                          src={url}
                          alt="extra"
                          className="rounded"
                          style={{ width: 80, height: 80, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center bg-light rounded"
                          style={{ width: 80, height: 80 }}
                        >
                          <span className="small text-muted">אין תמונה</span>
                        </div>
                      )}
                      <div className="small mt-1">{(item.type || []).join(", ") || "פריט"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* נימוק */}
          {picked.reason && (
            <div className="mt-4">
              <h6>למה הלוק הזה מתאים?</h6>
              <div className="p-3 bg-light border rounded">{picked.reason}</div>
            </div>
          )}

          {/* פריטים חסרים */}
          {picked.missingItems && picked.missingItems.length > 0 && (
            <div className="mt-3">
              <div className="alert alert-info">
                <strong>פריטים שלא נמצאו בארון:</strong>
                <ul className="mb-0 mt-2">
                  {picked.missingItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

console.log("API key loaded?", import.meta.env.VITE_OPENAI_API_KEY ? "yes" : "no");
