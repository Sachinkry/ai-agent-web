import { useState } from "react"

export function useOrchestrator() {
  const [logs, setLogs] = useState<string[]>([])
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function runTask(prompt: string) {
    setLogs([])
    setSandboxUrl(null)
    setLoading(true)

    const res = await fetch("/api/task", {
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
        if (line.startsWith("[SANDBOX]")) {
          setSandboxUrl(line.replace("[SANDBOX] ", ""))
        } else if (line.trim()) {
          setLogs((prev) => [...prev, line])
        }
      })
    }

    setLoading(false)
  }

  return { logs, sandboxUrl, loading, runTask }
}
