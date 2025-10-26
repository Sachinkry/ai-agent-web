import { useState } from "react"
import { Button } from "./ui/button"

export default function ChatInterface({ logs, loading, onSubmit }: any) {
    const [prompt, setPrompt] = useState("")
  
    return (
      <>
        <h1 className="text-2xl font-bold">🔮 Gemini Sandbox</h1>
  
        <div className="flex-1 overflow-y-auto space-y-3 rounded-lg p-4 bg-zinc-100 dark:bg-zinc-900 border">
          {logs.map((log: string, i: number) => (
            <div
              key={i}
              className={`p-2 rounded-md ${
                log.startsWith("[LOG]") || log.startsWith("[STEP]")
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                  : log.startsWith("[E2B_RESULT]")
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                  : "bg-gray-50 dark:bg-gray-800"
              }`}
            >
              {log.replace(/^\[(.*?)\]\s*/, "")}
            </div>
          ))}
        </div>
  
        <div className="flex space-x-2 mt-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Ask Gemini to run code..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit(prompt)}
          />
          <Button disabled={loading} onClick={() => onSubmit(prompt)}>
            {loading ? "Running..." : "Run"}
          </Button>
        </div>
      </>
    )
  }
  