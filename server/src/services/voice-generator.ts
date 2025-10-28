import { config } from "@/utils/config.js";
import fs from "fs";
import path from "path";

// Define the mapping of speaker names to ElevenLabs voice IDs
const speakerVoiceMap: Record<string, string> = {
  Sarah: "EXAVITQu4vr4xnSDxMaL",
  Brian: "nPczCjzI2devNBz1zQrb",
  // Add other speakers and their voice IDs here if needed
  Alex: "JBFqnCBsd6RMkjVDRZzb", // Example default voice
  Jamie: "JBFqnCBsd6RMkjVDRZzb", // Example default voice
};

/**
 * Parses a script string to extract speaker and dialogue segments,
 * handling both single-line and multi-line formats.
 * @param script The full script text.
 * @param speakers An array of known speaker names.
 * @returns An array of objects, each containing a speaker and their dialogue.
 */
function parseScript(
  script: string,
  speakers: string[]
): { speaker: string; dialogue: string }[] {
  const segments: { speaker: string; dialogue: string }[] = [];
  // Create a regex that matches any known speaker name followed by a colon
  // Example: /(Sarah|Brian|Alex|Jamie):/g
  const speakerRegex = new RegExp(`(${speakers.join("|")}):`, "g");

  let lastIndex = 0;
  let match;

  // Use regex.exec in a loop to find all speaker tags
  while ((match = speakerRegex.exec(script)) !== null) {
    // If there was text before the first speaker tag found, ignore it (preamble)
    if (segments.length === 0 && match.index > 0) {
      // Potentially log discarded preamble: script.substring(0, match.index).trim()
    }

    // Extract the dialogue for the *previous* speaker
    if (segments.length > 0) {
      const previousSpeakerEndIndex = segments[segments.length - 1].speaker.length + 1; // Index after "Speaker:"
      const dialogueStartIndex = script.indexOf(':', lastIndex) + 1;
      const dialogue = script.substring(dialogueStartIndex, match.index).trim();
      if (dialogue) {
        segments[segments.length - 1].dialogue = dialogue;
      }
    }

    // Add the newly found speaker
    segments.push({ speaker: match[1].trim(), dialogue: "" }); // Add speaker, dialogue added in next iteration or after loop
    lastIndex = match.index; // Update lastIndex to the start of the current match
  }

  // Extract the dialogue for the *last* speaker found
  if (segments.length > 0) {
     const lastSpeakerIndex = script.lastIndexOf(segments[segments.length - 1].speaker + ':');
     const dialogueStartIndex = lastSpeakerIndex + segments[segments.length - 1].speaker.length + 1;
     const dialogue = script.substring(dialogueStartIndex).trim();
     if (dialogue) {
       segments[segments.length - 1].dialogue = dialogue;
     }
  }

  // Filter out any segments where dialogue might still be empty (e.g., script ends with "Speaker:")
  return segments.filter(seg => seg.dialogue);
}


/**
 * Generates speech for a multi-speaker script using ElevenLabs API
 * by processing each line individually and concatenating the audio.
 * Handles both single-line and multi-line script formats.
 * Returns the local file path and a relative URL of the final audio.
 */
export async function generatePodcastAudio(script: string) {
  if (!config.ELEVENLABS_API_KEY) {
    console.warn("[voice] Missing ELEVENLABS_API_KEY – returning mock audio");
    return {
      filePath: "mock_podcast.mp3",
      urlPath: "/tmp/mock_podcast.mp3",
      base64: "",
      message: "Mock audio (no API key set)",
    };
  }

  // --- File Setup ---
  const outputDir = path.join(process.cwd(), "server", "tmp");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filename = `podcast_${Date.now()}.mp3`;
  const outputFile = path.join(outputDir, filename);
  const urlPath = `/tmp/${filename}`;

  // --- Parse Script using Regex ---
  const speakers = Object.keys(speakerVoiceMap);
  const segments = parseScript(script, speakers); // Use the new parsing function

  if (segments.length === 0) {
      console.warn("[voice] Could not parse any speaker segments from the script.");
      return {
          filePath: "",
          urlPath: "",
          base64: "",
          message: "Failed to parse script.",
      };
  }

  const audioBuffers: Buffer[] = [];
  console.log(`[voice] Processing ${segments.length} dialogue segments for TTS...`);

  // --- Process Each Segment ---
  for (const segment of segments) {
    const { speaker, dialogue } = segment;
    const voiceId = speakerVoiceMap[speaker]; // Voice ID is guaranteed to exist if speaker was parsed

    console.log(`[voice] Generating audio for ${speaker}...`);

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": config.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: dialogue,
            voice_settings: { stability: 0.4, similarity_boost: 0.8 },
            model_id: "eleven_multilingual_v2",
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `[voice] ElevenLabs API error for ${speaker}: ${res.status} ${errorText}`
        );
        continue; // Skip failed line
      }

      const arrayBuffer = await res.arrayBuffer();
      audioBuffers.push(Buffer.from(arrayBuffer));
      // Optional: Add delay
      // await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      console.error(`[voice] Error fetching TTS for ${speaker}:`, error);
      continue; // Skip on network error
    }
  }

  // --- Concatenate and Save ---
  if (audioBuffers.length === 0) {
    console.warn("[voice] No audio buffers generated. Cannot create podcast.");
    return {
      filePath: "",
      urlPath: "",
      base64: "",
      message: "Failed to generate any audio segments.",
    };
  }

  console.log(
    `[voice] Concatenating ${audioBuffers.length} audio segments...`
  );
  try {
    const finalAudioBuffer = Buffer.concat(audioBuffers);
    fs.writeFileSync(outputFile, finalAudioBuffer);

    console.log(`[voice] Final podcast audio saved to ${outputFile}`);

    return {
      filePath: outputFile,
      urlPath: urlPath,
      base64: "",
      message: "Podcast audio generated successfully.",
    };
  } catch (error) {
    console.error("[voice] Error concatenating or saving audio:", error);
    return {
      filePath: "",
      urlPath: "",
      base64: "",
      message: `Error saving final audio: ${error}`,
    };
  }
}

