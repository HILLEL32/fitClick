// src/AI/AiChat.jsx
import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/firebase";
import { askOpenAI } from "../AI/askOpenAI.jsx";
import { getWardrobe } from "../api/wardrobeApi";
import { getUserStyle } from "../api/UserApi";
import { useLocation } from "react-router-dom";
import "../css/AiChat.css"; // <<< חדש: עיצוב ורוד-כתום-חום

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
// פירוק בקשת המשתמש לדרישות (צבעים/פריטים/סגנונות/תנאים)
const parseUserRequest = (text) => {
  const requirements = { colors: [], items: [], styles: [], occasions: [] };
  const t = text || "";

  Object.keys(COLOR_MAP).forEach((he) => {
    if (t.includes(he)) requirements.colors.push(COLOR_MAP[he]);
  });

  Object.keys(ITEM_MAP).forEach((he) => {
    if (t.includes(he)) requirements.items.push(ITEM_MAP[he]);
  });

  // זיהוי מזג אוויר / תנאי סביבה
  // if (/גשום|גשם|יום גשמים|סערה|רטוב|שלוליות/.test(t)) {
  //   requirements.occasions.push("rainy");
  // }

  // if (/חורף|חורפי|קר|מעיל|סוודר/.test(t)) {
  //   requirements.occasions.push("cold");
  // }

  return requirements;
};


// נרמול ערכים למערך
const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// קלאסיפיקציה של פריט לעוגן → לאיזה slot הוא שייך
const classifySlot = (item) => {
  const types = toArr(item?.type).map(t => String(t).toLowerCase());
  const has = (...keys) => types.some(a => keys.some(k => a.includes(k)));

  if (has("dress")) return "top"; // שמלה תופסת top ומבטלת bottom
  if (has("jacket", "coat", "cardigan", "blazer", "overcoat")) return "outerwear";
  if (has("shirt", "top", "blouse", "t-shirt", "tee", "hoodie", "sweater")) return "top";
  if (has("pants", "jeans", "trousers", "skirt", "shorts", "chinos")) return "bottom";
  if (has("shoes", "sneakers", "heels", "boots", "sandals")) return "shoes";
  if (has("hat", "cap", "beanie", "beret", "headscarf", "kippah", "kipah")) return "headwear";
  return "extras";
};

// === Color base & normalization helpers ===
const BASE_COLORS = {
  white: ["white", "ivory", "offwhite", "off-white", "cream", "linen", "bone", "porcelain", "eggshell"],
  black: ["black", "charcoal", "eerie", "jet", "ink", "onyx"],
  blue: ["blue", "navy", "denim", "cobalt", "azure", "teal", "skyblue", "sky-blue", "babyblue"],
  green: ["green", "olive", "mint", "emerald", "sage", "pine", "pinetree", "forest"],
  red: ["red", "maroon", "burgundy", "crimson", "scarlet"],
  yellow: ["yellow", "mustard", "gold", "golden"],
  pink: ["pink", "blush", "rose", "magenta", "fuchsia", "charm pink", "soft pink"],
  purple: ["purple", "lavender", "violet", "lilac"],
  brown: ["brown", "beige", "tan", "camel", "khaki", "sand"],
  gray: ["gray", "grey", "silver", "slate", "ash"]
};

function cleanColorToken(c) {
  return String(c || "")
    .toLowerCase()
    .replace(/[^a-zא-ת\s-]/g, "")
    .replace(/[\s-]+/g, "")
    .trim();
}

function normalizeColorBase(c) {
  const token = cleanColorToken(c);
  if (!token) return null;

  for (const base of Object.keys(BASE_COLORS)) {
    if (token === base) return base;
  }
  for (const [base, variants] of Object.entries(BASE_COLORS)) {
    if (variants.some(v => {
      const t = cleanColorToken(v);
      return token === t || token.includes(t) || t.includes(token);
    })) return base;
  }

  if (/כהה|dark/.test(token)) return "black";
  if (/בהיר|light/.test(token)) return "white";
  return null;
}

function expandItemColorsWithBase(colors) {
  const arr = Array.isArray(colors) ? colors : (colors ? [colors] : []);
  const out = new Set();
  for (const c of arr) {
    const original = String(c || "").toLowerCase();
    if (original) out.add(original);
    const base = normalizeColorBase(c);
    if (base) out.add(base);
  }
  return Array.from(out);
}

const COLOR_SIMILARITY = {
  pink: ["red", "purple", "white", "beige"],
  red: ["pink", "brown", "purple"],
  blue: ["gray", "white", "black"],
  green: ["blue", "brown", "gray"],
  yellow: ["beige", "brown", "white"],
  purple: ["pink", "blue", "black"],
  brown: ["beige", "yellow", "black"],
  gray: ["black", "blue", "white"],
  black: ["gray", "navy", "brown"],
  white: ["beige", "gray", "pink"]
};

function isDarkColor(c) {
  const base = normalizeColorBase(c);
  if (["black", "navy", "brown", "gray", "purple", "green", "red"].includes(base)) return true;
  const s = String(c || "").toLowerCase();
  if (/black|gray|grey|navy|brown|dark/.test(s)) return true;
  return false;
}

function isLightColor(c) {
  const base = normalizeColorBase(c);
  if (["white", "beige", "yellow", "pink", "blue"].includes(base)) return true;
  const s = String(c || "").toLowerCase();
  if (/white|ivory|beige|cream|light|yellow|pink/.test(s)) return true;
  return false;
}

// === Filter wardrobe by occasion (e.g. sport) ===
function filterWardrobeForOccasion(wardrobe, requirements) {
  const lowerReqs = (requirements.occasions || []).map(r => String(r).toLowerCase());
  if (lowerReqs.includes("sport")) {
    return wardrobe.map(item => {
      const styles = (item.style || []).map(s => String(s).toLowerCase());
      const isSport = styles.some(s => s.includes("sport") || s.includes("athletic") || s.includes("gym") || s.includes("run"));
      const slot = classifySlot(item);
      if (["top", "bottom", "shoes"].includes(slot)) {
        return isSport ? item : null;
      }
      return item;
    }).filter(Boolean);
  }
  return wardrobe;
}

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
  // זה טעות- מעכשיו יש לנו שימוש בסטורג, הלוקל לא רלוונטי
  // const getImageDataUrl = (item) =>
  //   item?.imageId ? localStorage.getItem(item.imageId) : null;
  // ---------------------------------------------------------------------

  const getImageUrl = (item) => item?.imageUrl || item?.imageBase64 || null;


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

        console.log("Wardrobe sample:", items?.[0]);

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
      setPrompt(`התאם לוק שלם לעבודה/יציאה לפי הצורך, עם התאמת צבעים מדויקת. הוסף נעליים/כובע רק אם זה משפר את הסט.`);
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
    const compact = wardrobe.map((it) => ({
      id: it.id,
      type: toArr(it.type),
      colors: expandItemColorsWithBase(it.colors),
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
4) אם אין צבע מדויק בארון למה שהמשתמש ביקש, בחר/י את הצבע הקרוב ביותר והוסף/י ל-"violations" טקסט: 
closestColor: requested=<requestedBase>, chosen=<chosenBase>.
5) אם המשתמש מבקש לוק ש"מורכב מצבעים" מסוימים (למשל "לוק ורוד"), לפחות שני פריטים שונים בלוק (top, bottom או shoes) חייבים להיות בצבע המבוקש. אם זה לא אפשרי, החזר/י את מה שיש וציין/י את החסר ב-"missingItems".

חוקי עונות:
- אם המשתמש ביקש עונה מפורשות (winter/summer/autumn/spring) – היא מחייבת.
- אם המשתמש לא ביקש עונה – אל תוסיף עונה בעצמך.

מיפוי עונות להעדפות:
- winter: coat, jacket, sweater, hoodie, cardigan, turtleneck, wool pants, boots, scarf, beanie, gloves.
- summer: t-shirt, tank top, short-sleeve shirt, light blouse, shorts, light skirt, linen/cotton, sandals.
- autumn: light jacket/cardigan, long-sleeve shirt, jeans/chinos, closed shoes.
- spring: light layers, blouse, midi skirt, breathable fabrics.

סדר עדיפויות מחייב בעת בחירה:
1) בקשת משתמש מפורשת
2) צבעים
3) עונה
4) occasion
5) סגנון


אילוצים:
- אין לשלב "sport" עם "elegant" אלא אם המשימה דורשת.
- אם occasion= "sport":
  * בחר/י top, bottom ו-shoes אך ורק מפריטים שסגנונם כולל "sport".
  * אם אין פריטים כאלה בארון, החזר/י null בסלוטים המתאימים והוסף/י אותם ל-"missingItems".
- השתמש/י אך ורק ב-IDs שקיימים ב-wardrobe.

- אין לשלב פריטים עם דוגמאות/הדפסים שונים באותו לוק (למשל: חולצת משבצות עם חצאית פרחונית או בגד תחתון המשלב כמה צבעים).
- מותר לכל היותר פריט אחד "מקושקש/מודפס" בכל הלוק (Patterned item).
- אם יש פריט מקושקש שנבחר (למשל העוגן), כל שאר הפריטים חייבים להיות חלקים (ללא דוגמה) ובצבעים תואמים.
- אם המשתמש ביקש במפורש שילוב של כמה דוגמאות שונות, ציין/י זאת ב-"violations" והחזר/י לוק עם דוגמה אחת בלבד.
- כל הפריטים בלוק חייבים להשתייך לאותו קו סגנוני כללי.
- אין לשלב פריטים מקווי סגנון שונים גם אם הצבעים תואמים.
- אין להחזיר פריט הסותר את בקשת המשתמש (לדוגמא:אם המשתמש ביקש "לוק משרדי" אין להחזיר נעלי ריצה.)

- אם קיים Anchor, הוא קובע את קו הסגנון הכללי.
- אין לבחור פריט שסגנונו סותר את העוגן.

- אם אין התאמה שעומדת בכל החוקים, החזר/י null בסלוטים הרלוונטיים.


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
  "missingItems": ["רשימת פריטים/צבעים שביקש המשתמש ולא נמצאו"],
    "violations": ["closestColor: requested=<..>, chosen=<..>"]

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
        violations: Array.isArray(parsed.violations) ? parsed.violations : [],

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
        warnings.push("⚠️ הפריט שנבחר לא שובץ בסט כפי שהתבקש.");
      }
    }

    if (userRequirements.tone === "dark") {
      const anyDark = selectedItems.some(({ item }) =>
        toArr(item.colors).some(isDarkColor)
      );
      if (!anyDark) {
        warnings.push("התבקשה פלטה 'כהה' — לא נבחר אף פריט בצבע כהה.");
      }
    }

    if (userRequirements.tone === "light") {
      const anyLight = selectedItems.some(({ item }) =>
        toArr(item.colors).some(isLightColor)
      );
      if (!anyLight) {
        warnings.push("התבקשה פלטה 'בהירה' — לא נבחר אף פריט בצבע בהיר.");
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
    <div className="aichat-page" dir="rtl">
      <div className="aichat-overlay" />
      <div className="container aichat-container">
        <h2 className="mb-4 text-center">יועץ האופנה החכם</h2>

        {/* קלט המשתמש */}
        <div className="mb-3 aichat-input-block">
          <label className="form-label aichat-label">מה תרצה שה-AI יתאים לך?</label>
          <input
            type="text"
            className="form-control aichat-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="לדוגמה: לוק חורפי לעבודה: חולצה לבנה ומכנס כהה"
            disabled={loadingAsk}
          />
          <div className="form-text aichat-hint">
            טיפ: ציין צבעים ספציפיים ועונה (למשל: “לוק חורפי / קייצי”) לקבלת התאמה טובה יותר.
          </div>
        </div>

        <button
          className="btn btn-ai"
          onClick={onAsk}
          disabled={loadingAsk || loadingWardrobe || wardrobe.length === 0}
        >
          {loadingAsk ? "מבקש מה-AI..." : "בקש לוק מהארון שלי"}
        </button>


        {loadingAsk && (
          <div className="inline-loader-row" aria-live="polite" role="status">
            <span className="loader loader--sm" aria-label="מבקש מה-AI..."></span>
            <span className="inline-loader-text">מבקש מה-AI…</span>
          </div>
        )}

        {/* סטטוסים */}
        {loadingWardrobe && <div className="mt-3 aichat-status">טוען את הארון...</div>}
        {err && <div className="alert aichat-alert aichat-alert-danger mt-3">{err}</div>}
        {!loadingWardrobe && wardrobe.length === 0 && !err && (
          <div className="alert aichat-alert aichat-alert-warn mt-3">לא נמצאו פריטים בארון שלך.</div>
        )}

        {/* אזהרות ולידציה */}
        {/* {validationWarnings.length > 0 && (
          <div className="aichat-alert aichat-alert-warn mt-3">
            <strong>⚠️ שים לב:</strong>
            <ul className="mb-0 mt-2">
              {validationWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )} */}

        {/* תצוגת הסט שנבחר */}
        {picked && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="aichat-subheading">הסט שנבחר:</h5>
              {/* <div className="d-flex gap-2">
                {picked.confidence !== undefined && (
                  <span className="badge aichat-badge aichat-badge-info">
                    ביטחון: {Math.round(picked.confidence * 100)}%
                  </span>
                )}
                {picked.colorMatch && (
                  <span
                    className={`badge aichat-badge ${picked.colorMatch === "perfect"
                        ? "aichat-badge-success"
                        : picked.colorMatch === "partial"
                          ? "aichat-badge-warn"
                          : "aichat-badge-danger"
                      }`}
                  >
                    התאמת צבעים: {picked.colorMatch}
                  </span>
                )}
              </div> */}
            </div>

            <div className="row">
              {Object.entries(picked.selected)
                .filter(([slot, id]) => slot !== "extras" && id && byId[id])
                .map(([slot, id]) => {
                  const item = byId[id];
                  return (
                    <div className="col-md-3 mb-3" key={slot}>
                      <div className="card aichat-card h-100">
                        <div className="card-header aichat-card-header text-center">
                          <strong>{slot}</strong>
                        </div>
                        <div className="card-body text-center">

                          {getImageUrl(item) ? (
                            <img
                              src={getImageUrl(item)}
                              alt={slot}
                              className="img-fluid rounded mb-2 aichat-card-img"
                            />
                          ) : (
                            <div className="aichat-card-fallback rounded mb-2">
                              <span className="text-muted">אין תמונה</span>
                            </div>
                          )}

                          <div className="small aichat-meta">
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
                <h6 className="aichat-subheading-sm">אקססוריז נוספים:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {picked.selected.extras.map((id) => {
                    const item = byId[id];
                    if (!item) 
                      return null;
                    const url = getImageUrl(item);

                    return (
                      <div key={id} className="aichat-extra-tile text-center">
                        {url ? (
                          <img
                            src={url}
                            alt="extra"
                            className="rounded aichat-extra-img"
                          />
                        ) : (
                          <div className="aichat-extra-fallback rounded">אין תמונה</div>
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
                <h6 className="aichat-subheading-sm">למה הלוק הזה מתאים?</h6>
                <div className="aichat-reason">{picked.reason}</div>
              </div>
            )}

            {/* פריטים חסרים */}
            {/* {picked.missingItems && picked.missingItems.length > 0 && (
              <div className="mt-3 aichat-alert aichat-alert-info">
                <strong>פריטים שלא נמצאו בארון:</strong>
                <ul className="mb-0 mt-2">
                  {picked.missingItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )} */}

            {/* הערות התאמה / חריגות
            {picked.violations && picked.violations.length > 0 && (
              <div className="mt-3 aichat-alert aichat-alert-secondary">
                <strong>הערות התאמה/חריגות:</strong>
                <ul className="mb-0 mt-2">
                  {picked.violations.map((v, idx) => (
                    <li key={idx}>{v}</li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>
        )}
      </div>
    </div>
  );
}

console.log("API key loaded?", import.meta.env.VITE_OPENAI_API_KEY ? "yes" : "no");
