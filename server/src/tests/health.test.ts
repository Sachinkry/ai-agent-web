import { Hono } from "hono"
import { createSandbox } from "@/services/sandbox.js"
import router from "@/routes/podcast.js"
import { config } from "@/utils/config.js"
import { Orchestrator } from "@/services/orchestrator.js"

// Simple test runner (no Jest yet)
async function runTests() {
  console.log("🧪 Starting backend tests...\n")

  // --- CONFIG CHECK ---
  console.log("→ Checking .env configuration")
  if (!config.PORT) throw new Error("PORT missing")
  console.log("✅ Config loaded")

  // --- SANDBOX CHECK ---
  console.log("→ Creating sandbox...")
  const sandbox = await createSandbox()
  const { stdout } = await sandbox.runCode(`print("sandbox ok")`)
  console.log("✅ Sandbox responded:", Array.isArray(stdout) ? stdout.join("").trim() : stdout.trim())
  await sandbox.close()

  // --- ORCHESTRATOR PLAN CHECK ---
  console.log("→ Running orchestrator plan()...")
  const orch = new Orchestrator()
  const steps = await orch.plan("AI chip wars")
  if (!Array.isArray(steps)) throw new Error("Plan didn't return an array")
  console.log("✅ Plan:", steps)

  // --- ROUTE CHECK (mock server) ---
  console.log("→ Verifying /api/task route with Hono...")
  const app = new Hono()
  app.route("/", router)
  const res = await app.request("/api/task", {
    method: "POST",
    body: JSON.stringify({ prompt: "AI chip wars" }),
    headers: { "Content-Type": "application/json" },
  })
  if (res.status !== 200) throw new Error(`/api/task returned ${res.status}`)
  console.log("✅ Route responded with status 200")

  console.log("\n✅ All backend checks passed.")
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err)
  process.exit(1)
})
