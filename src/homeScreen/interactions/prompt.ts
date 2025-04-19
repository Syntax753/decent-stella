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

export async function submitPrompt(prompt: string, systemMessage: string = STELLA_SYSTEM_MESSAGE, _onResponse: Function, infinityMode: boolean = false) {

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
      generate(prompt, (status: string) => _onResponse(status));
    }
    // Multiple prompts
    // TODO: Chunk based on sentences with total chars < MAX_CHARS
    else {
      const chunks = chunkString(prompt, MAX_CHARS);
      let egoMap = new Map<string, string>();
      for (const chunk of chunks) {
        output = await generate(chunk, (status: string) => chunkedOutput(status), infinityMode);
        
        egoMap = mergeEgosFromJSONStrings([output], egoMap, ". ");
        _onResponse(egoMap);
      }

      current = '';
    }

  } catch (e) {
    console.error('Error while generating response.', e);
    _onResponse('Error while generating response.');
  }
}