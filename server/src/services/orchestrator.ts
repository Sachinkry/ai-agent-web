import { GoogleGenAI } from "@google/genai"
import { config } from "@/utils/config.js"
import { createSandbox } from "./sandbox.js"
import { generatePodcastScriptTool, runPythonTool, searchWebTool } from "./gemini-tools.js"
import { searchWeb } from "./web-search.js"
import { generatePodcastScript } from "./script_generator.js"

export class Orchestrator {
  private ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })

  // Stub event system preserved for compatibility with /api/task route
  on(_event: string, _callback: (...args: any[]) => void) {
    // no-op; you can implement EventEmitter if needed later
  }

  async plan(prompt: string) {
    // Keep your stub plan
    return ["Analyze Task", "Search News", "Generate Script"]
  }

  /**
   * One-call streaming orchestration with function-calling.
   * Supports multiple tool calls in sequence (search → python → finalize).
   */
  async executeWithFunctionCalling(
    prompt: string,
    opts?: { onLog?: (msg: string) => void }
  ) {
    const log = (m: string) => opts?.onLog?.(m)

    // Running conversation state
    const contents: any[] = [{ role: "user", parts: [{ text: prompt }] }]
    const tools = [{ functionDeclarations: [runPythonTool, searchWebTool, generatePodcastScriptTool] }]

    log?.(`[STEP] Sending prompt to Gemini...`)
    let response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { tools },
    })

    // Loop to satisfy multiple tool calls if the model wants them
    for (let safety = 0; safety < 4; safety++) {
      const fn = response.functionCalls?.[0]

      // No tool call – return text.
      if (!fn) {
        log?.(`[DONE] Gemini text-only response.`)
        return response.text ?? "(no text)"
      }

      // Handle the tool call
      log?.(`[FUNC] ${fn.name}`)
      log?.(`[ARGS] ${JSON.stringify(fn.args, null, 2)}`)

      if (fn.name === "run_python_in_sandbox") {
        const code = (fn.args as Record<string, any>).code
        log?.(`[CODE] ${code}`)

        const sandbox = await createSandbox()
        log?.(`[E2B] Sandbox started`)

        const result = await sandbox.runCode(code)
        await sandbox.close()
        log?.(`[E2B_RESULT] ${JSON.stringify(result)}`)

        // Feed function response back
        const functionResponsePart = {
          name: fn.name,
          response: { result },
        }
        const candidateContent = response.candidates?.[0]?.content
        if (candidateContent) contents.push(candidateContent)
        contents.push({ role: "user", parts: [{ functionResponse: functionResponsePart } as any] })

      } else if (fn.name === "search_web") {
        const { query, max_results } = fn.args as Record<string, any>
        log?.(`[SEARCH] ${query}`)
        try {
          const result = await searchWeb(query, { max_results })
          // log?.(`[SEARCH_RESULT] ${JSON.stringify(result).slice(0, 800)}...`)
          opts?.onLog?.(`[FILE] {"tool":"search_web","filename":"search_result.json","content":${JSON.stringify(result)}}`)


          const functionResponsePart = {
            name: fn.name,
            response: result,
          }
          const candidateContent = response.candidates?.[0]?.content
          if (candidateContent) contents.push(candidateContent)
          contents.push({ role: "user", parts: [{ functionResponse: functionResponsePart } as any] })
        } catch (err: any) {
          log?.(`[ERROR] search_web: ${err?.message || String(err)}`)
          const functionResponsePart = {
            name: fn.name,
            response: { error: String(err) },
          }
          const candidateContent = response.candidates?.[0]?.content
          if (candidateContent) contents.push(candidateContent)
          contents.push({ role: "user", parts: [{ functionResponse: functionResponsePart } as any] })
        }

      } else if (fn.name === "generate_podcast_script") {
        const { topic, news_data } = fn.args as Record<string, any>
        log?.(`[SCRIPT] Generating podcast for topic: ${topic}`)
      
        try {
          const script = await generatePodcastScript(topic, news_data)
          // log?.(`[SCRIPT_DONE] Script generated (${script.length} chars)`)
          opts?.onLog?.(`[FILE] {"tool":"generate_podcast_script","filename":"podcast_script.txt","content":${JSON.stringify(script)}}`)

      
          const functionResponsePart = {
            name: fn.name,
            response: { script },
          }
      
          const candidateContent = response.candidates?.[0]?.content
          if (candidateContent) contents.push(candidateContent)
          contents.push({
            role: "user",
            parts: [{ functionResponse: functionResponsePart } as any],
          })
        } catch (err: any) {
          log?.(`[ERROR] generate_podcast_script: ${err?.message || String(err)}`)
          const functionResponsePart = {
            name: fn.name,
            response: { error: String(err) },
          }
          const candidateContent = response.candidates?.[0]?.content
          if (candidateContent) contents.push(candidateContent)
          contents.push({ role: "user", parts: [{ functionResponse: functionResponsePart } as any] })
        }
      }      
      else {
        log?.(`[ERROR] Unknown function call: ${fn.name}`)
        const functionResponsePart = {
          name: fn.name,
          response: { error: `Unknown function call: ${fn.name}` },
        }
        const candidateContent = response.candidates?.[0]?.content
        if (candidateContent) contents.push(candidateContent)
        contents.push({ role: "user", parts: [{ functionResponse: functionResponsePart } as any] })
      }

      // Ask model to proceed (it may call more tools or produce final text)
      response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { tools },
      })
    }

    // Fallback in case of tool loop overflow
    return response.text ?? "(no final.text)"
  }
}
