import { GoogleGenAI } from "@google/genai"
import { config } from "@/utils/config.js"

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })

/**
 * Validates the generated podcast script to ensure it's in a strict
 * "Speaker: Dialogue" format, ready for TTS.
 * @param script The raw text script from the AI
 * @param speakers An array of valid speaker names (e.g., ["Alex", "Jamie"])
 * @returns An object { isValid: boolean, error?: string }
 */
function validatePodcastScript(
  script: string,
  speakers: string[]
): { isValid: boolean; error?: string } {
  if (!script || script.trim() === "") {
    return { isValid: false, error: "Script is empty." }
  }

  const lines = script.trim().split("\n")
  const speakerRegex = new RegExp(`^(${speakers.join("|")}): .`)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === "") continue // Allow empty lines for spacing

    // 1. Check for valid speaker prefix
    if (!speakerRegex.test(line)) {
      return {
        isValid: false,
        error: `Invalid line ${
          i + 1
        }: Line does not start with a valid speaker (e.g., "Alex: "). Got: "${line.slice(
          0,
          50
        )}..."`,
      }
    }

    // 2. Check for (parentheticals) or other markdown
    if (/\(.*\)/.test(line) || /[\*\_\[\]]/.test(line)) {
      return {
        isValid: false,
        error: `Invalid line ${
          i + 1
        }: Line contains parenthetical direction or markdown. Got: "${line.slice(
          0,
          50
        )}..."`,
      }
    }
  }

  // 3. Check that the first non-empty line is valid (no preamble)
  const firstLine = lines[0].trim()
  if (!speakerRegex.test(firstLine)) {
    return {
      isValid: false,
      error: `Script starts with invalid text (preamble). Got: "${firstLine.slice(
        0,
        50
      )}..."`,
    }
  }

  return { isValid: true }
}

export async function generatePodcastScript(topic: string, newsData: string) {
  const speakers = ["Sarah", "Brian"] // Define speakers

  const prompt = `
You are an expert podcast writer.
Your task is to write an engaging, conversational podcast script between the host "${
    speakers[0]
  }" and the guest "${speakers[1]}", about the topic "${topic}".

Use the following recent news data as context:
---
${newsData}
---

Content Guidelines:
- The script should be 1 to 2 minutes long (approx. 200 to 250 words).
- Use a natural, dynamic back-and-forth dialogue.
- Include curiosity hooks, questions, empathetic and reactions based on context.
- Reference the main points from the news data accurately.
- End with a clear takeaway or reflection.

---
VERY STRICT OUTPUT FORMAT
---
- You MUST follow this format exactly.
- The output MUST be ONLY the dialogue script.
- Each line of dialogue MUST start with the speaker's name and a colon, e.g., "${
    speakers[0]
  }: " or "${speakers[1]}: ".
- Do NOT include any other text, titles, descriptions, commentary, or markdown.
- Do NOT include any stage directions, sound effects, or parentheticals like (laughs) or (pauses).
- The response MUST begin with the very first line of dialogue, e.g., "Alex: Welcome to the show."
- Do NOT add a final "outro" or "thanks for listening" unless it's part of the dialogue.
`

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  })

  const rawScript = response.text ?? ""

  // --- VALIDATE THE SCRIPT ---
  const { isValid, error } = validatePodcastScript(rawScript, speakers)

  if (!isValid) {
    console.error(`[SCRIPT_VALIDATION_FAILED] ${error}`)
    // We throw an error so the orchestrator knows this step failed.
    throw new Error(
      `Generated script failed validation: ${error}. Raw script: "${rawScript.slice(
        0,
        200
      )}..."`
    )
  }

  console.log("[SCRIPT_VALIDATION_PASSED] Script is valid for TTS.")
  return rawScript
}