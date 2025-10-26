import { useGeminiAgent } from "./hooks/useGeminiAgent"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function App() {
  const { logs, loading, runTask, files } = useGeminiAgent()
  const [prompt, setPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState<{
    filename: string
    content: string
  } | null>(null)

  return (
    <div className="flex flex-col items-center h-screen p-8 space-y-4 bg-neutral-950 text-neutral-100">
      <h1 className="text-2xl font-bold">🔮 Tiny Runnable AI Agent</h1>

      {/* Input Bar */}
      <div className="flex w-full max-w-3xl space-x-2">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 rounded px-3 py-2 text-neutral-100"
          placeholder="Ask Gemini to search or create a podcast..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runTask(prompt)}
        />
        <Button className="bg-rose-500" disabled={loading} onClick={() => runTask(prompt)}>
          {loading ? "Running..." : "Run"}
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div
          className="w-full max-w-3xl border border-neutral-700 rounded-md  bg-neutral-900"
          // style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="border-b border-neutral-700 bg-neutral-800 text-sm sticky top-0">
            <div className="p-2 text-neutral-300 font-semibold">Files</div>
          </div>

          <div className="divide-y divide-neutral-800">
            {files.map((f) => (
              <Dialog key={f.filename}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedFile(f)}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-blue-400">{f.filename}</span>
                    <span className="text-neutral-500 text-xs ml-2">
                      ({f.tool})
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-neutral-950 text-neutral-100 border-neutral-700">
                  <DialogHeader>
                    <DialogTitle>{f.filename}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2 font-mono text-xs whitespace-pre-wrap bg-neutral-900 border border-neutral-800 p-3 rounded-md">
                  {f.filename.endsWith(".mp3") ? (
                      <audio controls src={f.content} className="w-full mt-2" />
                    ) : f.filename.endsWith(".json") ? (
                      JSON.stringify(f.content, null, 2)
                    ) : (
                      f.content
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      )}

      {/* Logs Terminal */}
      <div
        className="bg-black text-green-400 font-mono p-4 rounded-lg w-full max-w-3xl overflow-y-auto whitespace-pre-wrap border border-neutral-800"
        style={{ maxHeight: "70vh" }}
      > {!logs || logs.length === 0 ? (
        <div className="text-green-500">Sandbox. Logs will appear here...</div>
      ) : ""}
        {logs && logs.map((log, i) => (
          <div className="text-wrap" key={i}>{log.length > 1000 ? log.slice(0, 1000) + '…' : log}</div>
        ))}
      </div>
    </div>
  )
}
