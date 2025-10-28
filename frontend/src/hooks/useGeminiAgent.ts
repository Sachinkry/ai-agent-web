import { useState } from "react"

export function useGeminiAgent() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<{ tool: string; filename: string; content: string }[]>([])


  async function runTask(prompt: string) {
    setLogs([])
    setLoading(true)
    setFiles([])

    const res = await fetch("/api/gemini-fn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      chunk.split("\n").forEach((line) => {
        // if (!line.trim()) return // <--- 1. REMOVE THIS LINE
        const clean = line.trim() // We'll use this for checks

        if (clean.startsWith("[FILE]")) { // <--- 2. Check against 'clean'
            const raw = clean.replace("[FILE]", "").trim()
            try {
              const parsed = JSON.parse(raw)
              if (parsed.filename && parsed.content) {
                console.log("[UI_DEBUG] Parsed FILE event:", parsed.filename)
                setFiles((prev) => [
                  ...prev.filter((f) => f.filename !== parsed.filename),
                  parsed,
                ])
              }
            } catch (err) {
              console.error("[UI_DEBUG] Bad FILE JSON line:", raw.slice(0, 200), err)
            }
            return // Do not push to logs
        }
          
        // Push the original 'line' to preserve whitespace and empty lines
        setLogs((prev) => [...prev, line])
      })
    }
    setLoading(false)
  }

  return { logs, loading, runTask, files }
}