import { Hono } from "hono"
const router = new Hono()

router.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: Date.now() })
)

export default router
