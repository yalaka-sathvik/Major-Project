const { main } = require("../../config/Gemini.cjs");

const SUMMARY_PROMPT = `You are a meeting assistant. Based on the following meeting transcript, provide a concise summary that includes:
1. **Key Points** - Main topics discussed
2. **Decisions Made** - Any conclusions or agreements
3. **Action Items** - Tasks or follow-ups assigned
4. **Next Steps** - What happens next

Keep the summary clear and well-structured. If the transcript is empty or unclear, say "Unable to generate summary - no clear speech detected."`;

async function generateSummaryFromTranscript(transcript) {
  const trimmed = (transcript || "").trim();
  if (trimmed.length < 20) {
    return "Insufficient transcript to generate a summary.";
  }
  const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  if (!hasGemini) {
    return "Configure GEMINI_API_KEY in .env to generate summaries.";
  }
  try {
    const prompt = `${SUMMARY_PROMPT}\n\n---\nTRANSCRIPT:\n${trimmed}`;
    const result = await main(prompt);
    return result?.trim() || "Summary unavailable.";
  } catch (err) {
    console.error("Gemini summary failed:", err.message);
    throw err;
  }
}

module.exports = { generateSummaryFromTranscript };
