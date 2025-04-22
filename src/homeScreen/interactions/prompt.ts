import { isServingLocally } from "@/developer/devEnvUtil";
import { generate, isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
import { mergeEgosFromJSONStrings } from "@/data/conversion";

const MAX_CHARS: number = 500;

export const STELLA_SYSTEM_MESSAGE = `
You are a female bard in The Timeless Tavern where the Yarn of Yesteryear is Spun.
You are a storyteller and you are telling a story to the audience.
You are carrying a lute to help with telling the story.
Your want is to entertain the audience with your story.
Talk about yourself as though you are observing the scene.
`

export const GENERATING = '...';

function chunkString(str: string, chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

const formatTime = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const parts = [];
  if (hours > 0) parts.push(`${hours} hours`);
  if (minutes > 0) parts.push(`${minutes} minutes`);
  // if (seconds > 0 || parts.length === 0) parts.push(`${seconds.toFixed(2)} seconds`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds.toFixed(0)} seconds`);

  return parts.join(', ');
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitPrompt(prompt: string, systemMessage: string = STELLA_SYSTEM_MESSAGE, _onResponse: Function, infinityMode: boolean = false, _onProgress?: Function) {

  let output = '';
  let current = '';

  function chunkedOutput(message: string) {
    output = message;
  }

  setSystemMessage(systemMessage);
  _onResponse(GENERATING);

  try {

    if (!isLlmConnected()) {
      console.log("Generate LLM not connected")
      const message = isServingLocally()
        ? `LLM is not connected. You're in a dev environment where this is expected (hot reloads, canceling the LLM load). You can refresh the page to load the LLM.`
        : 'LLM is not connected. Try refreshing the page.';
      _onResponse(message);
      return;
    }

    // Single prompt
    if (!infinityMode) {
      generate(prompt, systemMessage, (status: string) => _onResponse(status));
    }
    // Multiple prompts
    // TODO: Chunk based on sentences with total chars < MAX_CHARS
    else {

      let task = '';
      let egoMap = new Map<string, string>();

      const chunks = chunkString(prompt, MAX_CHARS);

      let startTime = performance.now();
      for (let idx = 0; idx < chunks.length; idx++) {
        output = await generate(chunks[idx],systemMessage, (status: string) => chunkedOutput(status), infinityMode);

        egoMap = mergeEgosFromJSONStrings([output], egoMap, ". ");
        _onResponse(egoMap);

        let percent = (idx + 1) / chunks.length;

        let endTime = performance.now();
        let elapsed = endTime - startTime;
        let remaining = (elapsed / percent) * (1 - percent);
        let remainingFmt = formatTime(remaining);

        if (_onProgress) { _onProgress(percent, task, remainingFmt) };

        await delay(100); // Delay for 100 ms so user input can be proceessed
      }

      current = '';
    }

  } catch (e) {
    console.error('Error while generating response.', e);
    _onResponse('Error while generating response.');
  }
}