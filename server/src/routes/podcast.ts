import { Hono } from "hono"
import { Orchestrator } from "@/services/orchestrator.js"
import { streamText } from "hono/streaming"

const router = new Hono()

router.post("/api/task", async (c) => {
  const { prompt } = await c.req.json()
  const orch = new Orchestrator()

  return streamText(c, async (stream) => {
    const write = (line: string) => stream.write(line + "\n")

    orch.on("log", (msg) => write(`[LOG] ${msg}`))
    orch.on("sandbox_url", (url) => write(`[SANDBOX] ${url}`))
    orch.on("step_start", (s) => write(`[STEP] ${s}`))
    orch.on("step_done", ({ step, result }) =>
      write(`[DONE] ${step}: ${typeof result === "string" ? result : JSON.stringify(result)}`)
    )
    orch.on("error", ({ step, error }) => write(`[ERROR] ${step}: ${error}`))
    orch.on("done", () => write(`[COMPLETE]`))

    // await orch.initSandbox()
    const steps = await orch.plan(prompt)
    write(`[PLAN] ${JSON.stringify(steps)}`)
    // await orch.runSteps(steps, prompt)
    // await orch.close()
    stream.close()
  })
})

export default router
