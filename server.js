// T2R Chat Widget Server — 100% FREE version, deploy on Render
// Serves /widget.js and /api/chat, using Google Gemini's free API tier (no card needed)

const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

const ALLOWED_ORIGINS = [
  "https://2ndrefind.com",
  "https://www.2ndrefind.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.static("public"));

const SYSTEM_PROMPT = `You are the friendly customer support assistant for "The 2nd Refind" (T2R),
a streetwear clothing brand based in Karachi, Pakistan, selling premium drop-shoulder
t-shirts and trousers (e.g. the "Cinder" tee, "Dynasty" baggy trouser, "Ashen" acid-wash tee).

Rules:
- Only answer questions related to T2R's clothing, sizing, fabric, care, shipping,
  returns/exchanges, order status, and general styling advice.
- If asked about sizing, give general guidance and recommend checking the size chart
  on the product page, since you don't have live inventory data.
- For order status, payment issues, or anything account-specific, politely direct the
  customer to email the2ndrefind@gmail.com or use the Contact Us page.
- If asked something totally unrelated to the store, politely decline and steer back
  to how you can help with their T2R order.
- Keep answers short, warm, and on-brand (casual streetwear tone, not corporate).
- Never invent prices, stock levels, or shipping times you don't know.`;

const GEMINI_MODEL = "gemini-2.5-flash"; // free tier, good quality/speed balance

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided" });
    }

    const trimmed = messages.slice(-12); // cap history, keeps free quota lasting longer

    // Convert {role: "user"/"assistant", content} into Gemini's format
    const contents = trimmed.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 400 },
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({ error: data.error?.message || "Upstream error" });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't process that.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/health", (req, res) => res.send("ok"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`T2R widget server running on port ${PORT}`));
