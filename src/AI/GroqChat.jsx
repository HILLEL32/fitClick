import { useState } from "react";

export default function GroqChat() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const runGroq = async () => {
    setLoading(true);
    setResponse("");

    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", 
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Suggest me a winter outfit with a beanie, coat, t-shirt, and tanktop." }
          ],
        }),
      });

      const data = await r.json();
      setResponse(data.choices?.[0]?.message?.content || "No response");
    } catch (e) {
      setResponse("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>hi-1111111111111111</h2>
      <button onClick={runGroq} disabled={loading}>
        {loading ? "Loading..." : "Run Groq Test"}
      </button>
      <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
        {response}
      </div>
    </div>
  );
}
