import { config } from "@/utils/config.js"

interface SerperOrganicResult {
  title: string
  link: string
  snippet: string
  date?: string
}

interface SerperResponse {
  organic?: SerperOrganicResult[]
  [key: string]: unknown
}

interface SearchResult {
  title: string
  link: string
  snippet: string
  date?: string
}

export async function searchWeb(query: string, opts?: { num?: number }) {
  const key = process.env.SERPER_API_KEY || config.SERPER_API_KEY
  if (!key) {
    return {
      provider: "mock",
      query,
      results: [
        {
          title: "No SERPER_API_KEY set",
          link: "https://serper.dev",
          snippet: `Searched for "${query}"`,
        },
      ],
    }
  }

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: opts?.num ?? 5,
      gl: "us",
      hl: "en",
      tbs: "qdr:d", // restrict to past day
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Serper error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as SerperResponse
  const results: SearchResult[] =
    data.organic?.map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      date: r.date,
    })) ?? []

  return { provider: "serper", query, results }
}
