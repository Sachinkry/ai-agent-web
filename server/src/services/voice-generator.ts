import { config } from "@/utils/config.js"
import fs from "fs"
import path from "path"

/**
 * Generates speech using ElevenLabs API.
 * Returns the local file path and a relative URL.
 */
export async function generatePodcastAudio(script: string) {
  if (!config.ELEVENLABS_API_KEY) {
    console.warn("[voice] Missing ELEVENLABS_API_KEY – returning mock audio")
    return {
      filePath: "mock_podcast.mp3",
      urlPath: "", // <-- Add mock urlPath
      base64: "",
      message: "Mock audio (no key set)",
    }
  }

  const outputDir = path.join(process.cwd(), "server", "tmp")
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const filename = `podcast_${Date.now()}.mp3` // <-- 1. Store filename
  const outputFile = path.join(outputDir, filename) // <-- 2. Use filename
  const urlPath = `/tmp/${filename}` // <-- 3. Create relative URL

  const voiceId = "JBFqnCBsd6RMkjVDRZzb" // You can parameterize this later

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": config.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: script,
        voice_settings: { stability: 0.4, similarity_boost: 0.9 },
        model_id: "eleven_multilingual_v2",
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ElevenLabs TTS failed: ${text}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  fs.writeFileSync(outputFile, buffer)

  // const base64 = buffer.toString("base64") // No longer needed

  return {
    filePath: outputFile,
    urlPath: urlPath, // <-- 4. Return the URL path
    base64: "", // <-- 5. Don't need to send base64
    message: "Audio generated successfully",
  }
}