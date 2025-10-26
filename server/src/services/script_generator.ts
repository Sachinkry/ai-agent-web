import { GoogleGenAI } from "@google/genai"
import { config } from "@/utils/config.js"

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })

export async function generatePodcastScript(topic: string, newsData: string) {
  const prompt = `
  You are an expert podcast writer.
  Write a conversational podcast script between two hosts, "Alex" and "Jamie",
  about the topic "${topic}". 

  Use the following recent news data as context:
  ---
  ${newsData}
  ---

  The podcast should:
  - Be 5 to 10 minutes long (approx. 700–1000 words)
  - Use a natural, dynamic back-and-forth dialogue
  - Include curiosity hooks, questions, and reactions
  - Reference the main points accurately
  - End with a clear takeaway or reflection
  - Use timestamps or segment headings every 1–2 minutes

  Output ONLY the formatted podcast script. No commentary.
  `

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  })

  return response.text ?? "(no script generated)"
}
