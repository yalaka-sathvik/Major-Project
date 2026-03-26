const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS;
const ai = new GoogleGenAI({ apiKey });

async function main(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text;
}

module.exports = { main };
