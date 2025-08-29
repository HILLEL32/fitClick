// src/AI/askOpenAI.jsx
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * קריאה ל-OpenAI שמחזירה JSON-ONLY (כמחרוזת) עבור הסטייליסט
 * @param {string} prompt
 * @param {object} options
 */
export async function askOpenAI(prompt, options = {}) {
  const {
    model = "gpt-4o",
    temperature = 0.2,
    maxTokens = 2000,
  } = options;

  if (!OPENAI_API_KEY) {
    throw new Error("חסר VITE_OPENAI_API_KEY ב-.env (בצד ה-React).");
  }

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {

          role: "system",
          content: `
את/ה סטייליסט/ית אישי/ת ישראלי/ת. חובה להחזיר JSON תקין בלבד (ללא Markdown).

סכימת היציאה כוללת את השדות הבאים:
{
  "top": "...",
  "bottom": "...",
  "headwear": "... או null",
  "outerwear": "... או null",
  "shoes": "... או null",
  "extras": "... או null",
  "reason": "הסבר קצר אם אחד הסלוטים null"
}

כללים מחייבים:
- להתאים צבעים בדיוק לפי בקשת המשתמש.
- אין לשלב sport עם elegant אלא אם המשתמש ביקש זאת מפורשות.
- לבחור shoes ו/או headwear רק אם הם משפרים בפועל את הסט; אחרת להחזיר null.
- אם חסר פריט או צבע בארון המשתמש – החזר null עם הסבר בשדה reason.

מידע זמין:
1. רשימת בגדים אישית שהמשתמש העלה (כולל סוג, צבע, אורך, סגנון).
2. העדפות מוגדרות מראש של המשתמש (צבעים מועדפים, סוגי בגדים אהובים, סגנון לבוש).
3. בקשת לוק ספציפית מהמשתמש (למשל: "לוק ליום עבודה", "לוק ליציאה בערב").

המטרה:
- להחזיר לוק מלא מותאם אישית לבקשה.
- להתאים קודם כל להעדפות האישיות של המשתמש.
- להוסיף גם הצעות חדשות מחוץ להעדפות, אך תוך שמירה על בקשת המשתמש.
- להדגיש את הפריטים שמתאימים בדיוק להעדפות כבחירה ראשית, ואת השאר כאלטרנטיבות.
`.trim(),
        },

        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    let msg = `OpenAI HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI החזיר תשובה ריקה");
  return content; // JSON כמחרוזת
}
