import { Sandbox } from "@e2b/code-interpreter"
import { config } from "@/utils/config.js"

export async function createSandbox() {
  if (!config.E2B_API_KEY) {
    console.warn("[sandbox] Missing E2B_API_KEY – using MOCK sandbox.")
    return {
      async runCode(code: string) {
        return { stdout: "MOCK_SANDBOX:\n" + code, stderr: "" }
      },
      async close() {},
      
    }
  }

  console.log("[sandbox] Launching E2B sandbox...")
  const sandbox = await Sandbox.create({ apiKey: config.E2B_API_KEY })

  return {
    async runCode(code: string) {
      const result = await sandbox.runCode(code)
      return {
        stdout: result.logs.stdout,
        stderr: result.logs.stderr,
      }
    },
    async close() {
      // No-op for @e2b/code-interpreter
    },
    
  }
}
