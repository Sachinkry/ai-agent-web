export function emitFileEvent(opts: { onLog?: (msg: string) => void }, tool: string, filename: string, content: string) {
    try {
      const payload = { tool, filename, content }
      const json = `[FILE] ${JSON.stringify(payload)}`
      // ✅ Send to frontend
      opts.onLog?.(json)
      // ✅ Also confirm in backend console (shortened)
      console.log(`[DEBUG_EMIT_FILE] ${filename} emitted (${content.slice(0, 50)}...)`)
    } catch (err) {
      console.error("[emitFileEvent] Failed to emit file event:", err)
    }
  }
  