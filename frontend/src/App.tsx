import { useGeminiAgent } from "./hooks/useGeminiAgent"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function App() {
  const { logs, loading, runTask, files } = useGeminiAgent()
  const [prompt, setPrompt] = useState("")
  const [activeFile, setActiveFile] = useState<string | null>(null)

  // Split Gemini logs and sandbox logs
  const sandboxLogs = logs.filter((l) => l.includes("[E2B_RESULT]") || l.includes("stdout"))
  const chatLogs = logs.filter((l) => !sandboxLogs.includes(l))

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border text-center font-bold text-xl">
        🔮 Tiny Runnable AI Agent
      </header>

      <main className="flex flex-1 flex-col md:flex-row  ">
        {/* Chat Section */}
        <div className="flex flex-col w-full  border-r border-border p-4 space-y-4">
          <h2 className="text-lg font-semibold">💬 Chat</h2>

          <div className="flex space-x-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Ask Gemini to run code..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runTask(prompt)}
            />
            <Button disabled={loading} onClick={() => runTask(prompt)}>
              {loading ? "Running..." : "Run"}
            </Button>
          </div>

          

          <div className="bg-black text-green-400 font-mono p-3 rounded-lg flex-1 overflow-y-auto whitespace-pre-wrap">
            {chatLogs.length === 0 && (
              <div className="opacity-50 text-sm">No logs yet. Try running a prompt.</div>
            )}
            {chatLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>

        {/* Sandbox Section */}
        {/* <div className="flex flex-col w-full md:w-2/5 p-4">
          <h2 className="text-lg font-semibold mb-2">🧩 Sandbox Output</h2>

          <div className="bg-zinc-900 text-blue-300 font-mono p-3 rounded-lg flex-1 overflow-y-auto whitespace-pre-wrap">
            {sandboxLogs.length === 0 && (
              <div className="opacity-50 text-sm">No sandbox output yet.</div>
            )}
            {sandboxLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div> */}
        {files.length > 0 && (
          <div className="w-full max-w-xl border rounded-md overflow-hidden bg-neutral-900 text-white">
          <div className="flex border-b border-neutral-700 bg-neutral-800 text-sm">
            {files.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveFile(f.filename)}
                className={`px-3 py-2 hover:bg-neutral-700 ${
                  activeFile === f.filename ? "bg-neutral-700 font-bold" : ""
                }`}
              >
                {f.filename}
              </button>
            ))}
          </div>

          <div className="p-3 font-mono text-xs h-64 overflow-y-auto whitespace-pre-wrap">
            {activeFile
              ? (() => {
                  const file = files.find((f) => f.filename === activeFile)
                  if (!file) return "No file selected"
                  try {
                    return file.filename.endsWith(".json")
                      ? JSON.stringify(file.content, null, 2)
                      : file.content
                  } catch {
                    return String(file.content)
                  }
                })()
              : "Select a file to view its contents."}
          </div>
        </div>

        )}
      </main>
    </div>
  )
}
