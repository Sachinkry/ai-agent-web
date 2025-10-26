import { Type } from "@google/genai"

export const runPythonTool = {
  name: "run_python_in_sandbox",
  description:
    "Executes Python code safely in a remote sandbox and returns stdout/stderr.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: "Python code to execute inside sandbox",
      },
    },
    required: ["code"],
  },
}

export const searchWebTool = {
  name: "search_web",
  description:
    "Search the live web for recent info. Use for news, updates, or when the user asks for 'latest'. Returns concise results.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Search query string" },
      max_results: {
        type: Type.NUMBER,
        description: "Max number of results (1-10)",
      },
    },
    required: ["query"],
  },
}

export const generatePodcastScriptTool = {
    name: "generate_podcast_script",
    description:
      "Takes recent news search results and writes an engaging 5-10 minute podcast script with 2 speakers.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: "The main topic or theme of the podcast",
        },
        news_data: {
          type: Type.STRING,
          description:
            "Concatenated or summarized news articles from the web search",
        },
      },
      required: ["topic", "news_data"],
    },
  }
  
  export const generateVoiceTool = {
    name: "generate_voice",
    description:
      "Converts the podcast script into spoken audio using ElevenLabs text-to-speech.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        script: {
          type: Type.STRING,
          description: "Podcast script text to convert to speech",
        },
        voice: {
          type: Type.STRING,
          description: "Voice name or ID to use (default: Rachel)",
        },
      },
      required: ["script"],
    },
  }
  
