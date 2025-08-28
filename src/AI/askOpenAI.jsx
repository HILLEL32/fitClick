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
    model = "gpt-4o-mini",
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
 את/ה סטייליסט/ית ישראלי/ת. תמיד החזר/י JSON תקין בלבד (ללא Markdown).
 התאם/י צבעים בדיוק לפי בקשת המשתמש. אין לשלב sport עם elegant אלא אם נדרש מפורשות.
 סכימת היציאה כוללת: top, bottom, headwear, outerwear, shoes, extras.
 בחר/י shoes ו/או headwear רק אם זה משפר את הסט בפועל (אחרת החזר/י null).
 כאשר חסר פריט/צבע בארון – החזר/י null בסלוט והסבר/י בקצרה בשדה reason.
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
