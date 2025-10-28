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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronsUpDown, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"

export default function App() {
  const { logs, loading, runTask, files } = useGeminiAgent()
  const [prompt, setPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState<{
    filename: string
    content: string
  } | null>(null)

  const completeIndex = logs.findIndex((log) => log.startsWith("[COMPLETE]"))

  let finalOutput: string | null = null
  let runLogs: string[] = logs // Default to all logs

  if (completeIndex !== -1) {
    // If [COMPLETE] is found:
    // 1. Get all log entries *from* that index to the end
    const outputLines = logs.slice(completeIndex)

    // 2. Join them back together with newlines
    // 3. Remove the [COMPLETE] prefix from the first line
    finalOutput = outputLines
      .join("\n")
      .replace("[COMPLETE]", "")
      .trim()
    
    // 4. Run logs are everything *before* that index
    runLogs = logs.slice(0, completeIndex)
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-8 space-y-4 bg-neutral-950 text-neutral-100">
      <h1 className="text-2xl font-bold">🔮 Tiny Runable AI Agent</h1>

      {/* Input Bar */}
      <div className="flex w-full max-w-3xl space-x-2">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 rounded px-3 py-2 text-neutral-100"
          placeholder="Ask Gemini to search or create a podcast..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runTask(prompt)}
        />
        <Button
          className="bg-rose-500"
          disabled={loading}
          onClick={() => runTask(prompt)}
        >
          {loading ? "Running..." : "Run"}
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div
          className="w-full max-w-3xl border border-neutral-700 rounded-md  bg-neutral-900"
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

      {/* Logs Terminal (Collapsible) */}
      {(logs.length > 0 || loading) && (
        <Collapsible defaultOpen={false} className="w-full max-w-3xl">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-left border rounded-md border-neutral-700 bg-neutral-900 hover:bg-neutral-800 data-[state=open]:rounded-b-none">
              <span>{loading ? "View Live Logs..." : "View Full Logs"}</span>
              <ChevronsUpDown className="size-4" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              className="bg-black text-green-400 font-mono p-4 rounded-b-lg w-full max-w-3xl overflow-y-auto whitespace-pre-wrap border border-neutral-800 border-t-0"
              style={{ maxHeight: "50vh" }}
            >
              {runLogs.length === 0 && loading ? (
                <div className="text-green-500">
                  Sandbox logs will appear here...
                </div>
              ) : runLogs.length === 0 && !loading ? (
                <div className="text-green-500">No logs for this run.</div>
              ) : (
                runLogs.map((log, i) => (
                  <div className="text-wrap" key={i}>
                    {log.length > 1000 ? log.slice(0, 1000) + "…" : log}
                  </div>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Final Output Box */}
      {finalOutput && !loading && (
        <div className="w-full max-w-3xl p-4 space-y-2 bg-neutral-900 border border-neutral-700 rounded-lg">
          <div className="flex items-center gap-2 text-lg font-semibold text-green-400">
            <Check className="size-5" />
            Result
          </div>
          <div className="pl-7 text-neutral-100 text-sm">
          <ReactMarkdown
            components={{
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc list-outside pl-5 space-y-1"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal list-outside pl-5 space-y-1"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
            }}
          >
            {finalOutput}
          </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}