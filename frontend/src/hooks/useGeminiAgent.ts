import { useState } from "react"

export function useGeminiAgent() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)
  const [files, setFiles] = useState<{ tool: string; filename: string; content: string }[]>([])


  async function runTask(prompt: string) {
    setLogs([])
    setSandboxUrl(null)
    setLoading(true)

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
        if (!line.trim()) return

        if (line.startsWith("[FILE]")) {
            try {
              const json = JSON.parse(line.replace("[FILE] ", ""))
              setFiles((prev) => [...prev, json])
            } catch (err) {
              console.error("Bad FILE line:", line, err)
            }
            return
          }
        

        setLogs((prev) => [...prev, line])
      })
    }

    setLoading(false)
  }

  return { logs, loading, runTask, files }
}
