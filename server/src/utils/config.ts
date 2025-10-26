import 'dotenv/config'

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export const config = {
  PORT: Number(process.env.PORT || 3001),
  // Make these optional for dev; orchestrator will guard where needed:
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  E2B_API_KEY: process.env.E2B_API_KEY || '',
  // Optional:
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  // TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
  SERPER_API_KEY: process.env.SERPER_API_KEY || '',
}
