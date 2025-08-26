// src/AI/askGroq.js - Updated API functions
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Enhanced Groq API call with optimized parameters for fashion styling
 * @param {string} prompt
 * @param {object} options
 */
export async function askGroq(prompt, options = {}) {
  const {
    model = "llama3-70b-8192",
    temperature = 0.1,        // Much lower for precision
    maxTokens = 2000,
    topP = 0.8,              // More focused responses  
    frequencyPenalty = 0.2,  // Reduce repetition
    presencePenalty = 0.1    // Encourage following instructions
  } = options;

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
  {
    role: "system",
    content: `
You are a precise Hebrew-speaking fashion stylist for Israeli users.
Rules:
- Always output VALID JSON only (no Markdown).
- Color accuracy: when the user specifies colors, match exactly (do not substitute).
- SEASONS: Prefer season-appropriate garments based on "requestedSeason" (winter/summer/autumn/spring).
  * winter: coat, jacket, sweater, hoodie, cardigan, turtleneck, wool pants, thermal layers, boots, scarf, beanie, gloves.
  * summer: t-shirt, tank top, short-sleeve shirt, light blouse, shorts, skirt (light), linen/cotton, sandals/sneakers.
  * autumn: light jacket, cardigan, long-sleeve shirt, chinos/jeans, closed shoes.
  * spring: light layers, blouse, midi skirt, light cardigan, breathable fabrics.
- If season-appropriate items do not exist in the wardrobe, select the closest practical alternative OR return null for that slot, and explain briefly why.
- Avoid mixing sport with elegant unless the task explicitly requests it.
- Use only item IDs from the provided wardrobe.
`
  },
  { role: "user", content: prompt }
],
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stop: ["```", "Note:", "Important:", "\n\n\n"] // Stop at common hallucination patterns
    }),
  });

  const text = await res.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from Groq: ${text.substring(0, 200)}...`);
  }

  if (!res.ok) {
    const msg = data?.error?.message || `Groq API error: ${res.status} ${text}`;
    throw new Error(msg);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq API");
  }

  return content;
}

/**
 * OpenAI API call for comparison/fallback
 * @param {string} prompt
 * @param {object} options
 */
export async function askOpenAI(prompt, options = {}) {
  const {
    model = "gpt-4o-mini",    // Cost-effective but powerful
    temperature = 0.2,        // Low for consistent JSON
    maxTokens = 2000
  } = options;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file.");
  }

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { 
          role: "system", 
          content: `You are a professional fashion stylist with expertise in Israeli fashion and Hebrew styling terminology. 
                   You excel at color theory, seasonal appropriateness, and cultural fashion context.
                   Always respond in fluent Hebrew with detailed reasoning.
                   When users specify colors, you must match them exactly - never substitute similar colors.
                   Always respond in valid JSON format only.` 
        },
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" } // Forces JSON response
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || `OpenAI API error: ${res.status}`;
    throw new Error(msg);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI API");
  }

  return content;
}

/**
 * Utility function to test both APIs and compare results
 * @param {string} prompt
 */
export async function compareModels(prompt) {
  const results = [];
  
  // Test Groq
  try {
    const startTime = Date.now();
    const groqResponse = await askGroq(prompt);
    const groqDuration = Date.now() - startTime;
    
    results.push({
      model: "Groq Llama3-70B",
      response: groqResponse,
      duration: groqDuration,
      success: true,
      cost: "Free"
    });
  } catch (error) {
    results.push({
      model: "Groq Llama3-70B", 
      error: error.message,
      success: false,
      cost: "Free"
    });
  }

  // Test OpenAI if key is available
  if (OPENAI_API_KEY) {
    try {
      const startTime = Date.now();
      const openaiResponse = await askOpenAI(prompt);
      const openaiDuration = Date.now() - startTime;
      
      results.push({
        model: "OpenAI GPT-4o-mini",
        response: openaiResponse,
        duration: openaiDuration,
        success: true,
        cost: "~$0.0015 per request"
      });
    } catch (error) {
      results.push({
        model: "OpenAI GPT-4o-mini",
        error: error.message,
        success: false,
        cost: "~$0.0015 per request"
      });
    }
  }

  return results;
}