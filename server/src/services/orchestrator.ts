import { GoogleGenAI } from "@google/genai"
import { config } from "@/utils/config.js"
import { createSandbox } from "./sandbox.js"
import { generatePodcastScriptTool, generateVoiceTool, runPythonTool, searchWebTool } from "./gemini-tools.js"
import { searchWeb } from "./web-search.js"
import { generatePodcastScript } from "./script_generator.js"
import { generatePodcastAudio } from "./voice-generator.js"
import { emitFileEvent } from "@/utils/util.js"
import { createSystemPrompt } from "@/prompts/system.js"

export class Orchestrator {
  private ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })

  private toolRegistry: Map<string, (args: any, opts: any) => Promise<any>>

  constructor() {
    this.toolRegistry = new Map()
    this.toolRegistry.set("search_web", this.handleSearchWeb)
    this.toolRegistry.set("generate_podcast_script", this.handleGenerateScript)
    this.toolRegistry.set("generate_voice", this.handleGenerateVoice)
    this.toolRegistry.set("run_python_in_sandbox", this.handleRunPython)
  }

  private async handleSearchWeb(args: { query: string, max_results: number }, opts: { onLog?: (msg: string) => void }) {
    opts.onLog?.(`[SEARCH] ${args.query}`)
    const result = await searchWeb(args.query, { max_results: args.max_results })
    
    // Emit the file for the UI
    opts.onLog?.(`[FILE] {"tool":"search_web","filename":"search_result.json","content":${JSON.stringify(result)}}`)
    
    // Return the result for Gemini
    return result
  }

  private async handleGenerateScript(args: { topic: string, news_data: string }, opts: { onLog?: (msg: string) => void }) {
    opts.onLog?.(`[SCRIPT] Generating podcast for topic: ${args.topic}`)
    const script = await generatePodcastScript(args.topic, args.news_data)
    
    opts.onLog?.(`[FILE] {"tool":"generate_podcast_script","filename":"podcast_script.txt","content":${JSON.stringify(script)}}`)
    
    return { script } // Return what Gemini needs
  }
  
  private async handleGenerateVoice(args: { script: string, voice: string }, opts: { onLog?: (msg: string) => void }) {
    opts.onLog?.(`[VOICE] Generating podcast audio...`)
    const result = await generatePodcastAudio(args.script)
    
    // Emit the file (URL) for the UI
    emitFileEvent(opts!, "generate_voice", "podcast_audio.mp3", result.urlPath)
    
    // Return a minimal response for Gemini
    return { success: true, message: result.message, filename: "podcast_audio.mp3" }
  }
  
  private async handleRunPython(args: { code: string }, opts: { onLog?: (msg: string) => void }) {
    opts.onLog?.(`[CODE] ${args.code}`)
    const sandbox = await createSandbox()
    opts.onLog?.(`[E2B] Sandbox started`)
    const result = await sandbox.runCode(args.code)
    await sandbox.close()
    opts.onLog?.(`[E2B_RESULT] ${JSON.stringify(result)}`)
    return result
  }

  // Stub event system preserved for compatibility with /api/task route
  on(_event: string, _callback: (...args: any[]) => void) {
    // no-op; you can implement EventEmitter if needed later
  }

  async plan(prompt: string) {
    // Keep your stub plan
    return ["Analyze Task", "Search News", "Generate Script"]
  }

  safePreview = (v: any, max = 400) => {
    const s = typeof v === "string" ? v : JSON.stringify(v)
    return s.length > max ? s.slice(0, max) + "..." : s
  }
  
  async executeWithFunctionCalling(
    prompt: string,
    opts?: { onLog?: (msg: string) => void }
  ) {
    const log = (m: string) => opts?.onLog?.(m)

    log?.(`[STEP] Generating plan...`)
    // try {
    //   const planPrompt = `You are a helpful AI assistant. Based on the user's request, please outline a brief, step-by-step plan of which tools you will use to accomplish the goal. Do not use any tools yet, just provide the text-based plan.
      
    //   User Request: "${prompt}"
      
    //   Example Plan:
    //   1. Search the web for the requested topic using the 'search_web' tool.
    //   2. Generate a podcast script based on the search results using 'generate_podcast_script'.
    //   3. Convert the script to audio using 'generate_voice'.
    //   4. Present the final audio file to the user.`

    //   const planResponse = await this.ai.models.generateContent({
    //     model: "gemini-2.5-flash",
    //     contents: [{ role: "user", parts: [{ text: planPrompt }] }],
    //     // We provide NO tools here, forcing a text response
    //     config: { tools: [] }, 
    //   })

    //   const planText = planResponse.text ?? "No plan could be generated."
    //   log?.(`[PLAN] \n${planText}`)

    // } catch (err: any) {
    //   log?.(`[ERROR] Failed to generate plan: ${err.message}`)
    // }

    
    // --- 3. GET TOOL DEFINITIONS DYNAMICALLY ---
    
    const allToolDeclarations = [
      runPythonTool, 
      searchWebTool, 
      generatePodcastScriptTool,
      generateVoiceTool
    ]
    const tools = [{ functionDeclarations: allToolDeclarations }]
    const systemPrompt = createSystemPrompt(allToolDeclarations as any[])

    log?.(`[STEP] Initializing agent with system prompt...`)

    const contents: any[] = [
      {
        role: "user",
        parts: [{
          text: `${systemPrompt}\n\n---START OF REQUEST---\n\nUser Request: "${prompt}"`
        }]
      }
    ]
    
    log?.(`[STEP] Sending prompt to Gemini...`)
    let response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents, // <-- This now contains the system prompt
      config: { tools },
    })

    // tool call loop
    for (let safety = 0; safety < 4; safety++) {
      const fn = response.functionCalls?.[0]
      if (!fn) {
        log?.(`[DONE] Gemini text-only response.`)
        return response.text ?? "(no text)"
      }

      log?.(`[FUNC] ${fn.name}`)
      log?.(`[ARGS] ${this.safePreview(fn.args, 400)}`)

      // --- 4. DYNAMIC DISPATCH ---
      // (This replaces your entire if/else block)
      
      let functionResult: any
      if (fn.name && this.toolRegistry.has(fn.name)) {
        try {
          const toolHandler = this.toolRegistry.get(fn.name)!
          // Pass 'opts' so handlers can log and emit files
          const result = await toolHandler(fn.args, opts) 
          functionResult = {
            name: fn.name,
            response: result,
          }
        } catch (err: any) {
          log?.(`[ERROR] ${fn.name}: ${err?.message || String(err)}`)
          functionResult = {
            name: fn.name,
            response: { error: String(err) },
          }
        }
      } else {
        log?.(`[ERROR] Unknown function call: ${fn.name}`)
        functionResult = {
          name: fn.name,
          response: { error: `Unknown function call: ${fn.name}` },
        }
      }
      // --- END OF DYNAMIC DISPATCH ---

      const candidateContent = response.candidates?.[0]?.content
      if (candidateContent) contents.push(candidateContent)
      contents.push({ role: "user", parts: [{ functionResponse: functionResult } as any] })

      response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { tools },
      })
    }

    return response.text ?? "(no final.text)"
  }
}
