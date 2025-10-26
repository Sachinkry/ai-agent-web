import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import router from "./routes/podcast.js"
import { config } from "./utils/config.js"
import health from "./routes/health.js"
import geminiFn from "./routes/geminiFn.js"

const app = new Hono()
app.use("/*", cors({ origin: "*", credentials: false }))

app.route("/", router)
app.route("/", health)
app.route("/", geminiFn)
serve({ fetch: app.fetch, port: config.PORT })
console.log(`Server running on :${config.PORT}`)
