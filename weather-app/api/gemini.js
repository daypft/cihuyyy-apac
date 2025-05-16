
export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  try {
    console.log("Prompt received by Gemini proxy:", JSON.stringify(req.body));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      }
    );

    const data = await geminiRes.json();
    console.log("Gemini response body:", JSON.stringify(data));

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ error: "No usable response from Gemini", raw: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Gemini proxy error:", error);
    res.status(500).json({ error: "Gemini fetch failed" });
  }
}
