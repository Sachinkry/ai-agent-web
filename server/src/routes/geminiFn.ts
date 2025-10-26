import { Orchestrator } from "@/services/orchestrator.js"
import { Hono } from "hono"

const router = new Hono()

router.post("/api/gemini-fn", async (c) => {
  const { prompt } = await c.req.json()
  const orchestrator = new Orchestrator()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) =>
        controller.enqueue(new TextEncoder().encode(`${msg}\n`))

      send(`[LOG] Received: ${prompt}`)

      const result = await orchestrator.executeWithFunctionCalling(prompt, {
        onLog: send,
      })

      send(`[COMPLETE] ${result}`)
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  })
})

export default router
