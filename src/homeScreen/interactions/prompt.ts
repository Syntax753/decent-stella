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

const CHARACTERS_SYSTEM_MESSAGE = `
Name all the characters in the story along with their personality.
Do not include characters that do not have a personality.

1. Collect the character and personality from the story and populate the json.
2. The fields in the json are
  - Name: This is the character's name
  - Ego: This is the character's personality

- Example 1:

{"name":"The Minotaur","ego":"Very friendly and likes apples"}
{"name":"Icarus","ego":"Loves flying and sunny days" }

- Example 2:

{"name":"Mary","ego":"Quite contrary and loves silver bells"}
{"name":"Humpty","ego":"Loves eating omelettes"}

- Example 3:

{"name":"Beethro","ego":"Enjoys exploring dangerous rooms"}
{"name":"Halp","ego":"Causes trouble whereever he goes - but is helpful too"}

- If a character doesn't have specific details about their personalities, specify their personality as "NONE"
- Do not provide an introduction.
- Only respond with json objects.
- Check for and correct any syntax errors in the json format.
`

const ACTORS_SYSTEM_MESSAGE = `
Name all the active characters in this scene as json.

- Example 1:

{"name":"The Minotaur"}
{"name":"Icarus"}

- Example 2:

{"name":"Mary"}
{"name":"Humpty"}

- Example 3:

{"name":"Beethro"}
{"name":"Halp"}

- If there are no characters mentioned, specify 
`

const EVENTS_SYSTEM_MESSAGE = `
For each character in this scene, output the the primary event in this scene and the character.

The output should be in Json.

--

- Example 1:
{"event: "The Maze", "character": "The Minotaur"}
{"event: "The Maze", "character": "Icarus"}

- Example 2:
{"event: "The Wall", "character": "Mary"}
{"event: "The Wall", "character": "Humpty"}

- Example 3:
{"event: "Dungeon", "character": "Beethro"}
{"event: "Dungeon", "character": "Halp"}

- If you can't identify an event, specify the event as "NONE"
- Do not provide an introduction.
- Only respond with json objects.
- Check for and correct any syntax errors in the json format.
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

export async function submitPrompt(systemPrompt: string = '', prompt: string, _onResponse: Function, chunkedMode: boolean = false, _onProgress?: Function) {

  let egos = '';
  let events = '';
  let actors = '';

  function chunkedOutput(message: string) {
    egos = message;
  }

  setSystemMessage(systemPrompt);
  _onResponse(GENERATING);

  try {

    if (!isLlmConnected()) {
      console.log("Generate LLM not connected")
      const message = isServingLocally()
        ? `LLM is not connected. You're in a dev environment where this is expected (hot reloads, cancelling the LLM load). You can refresh the page to load the LLM.`
        : 'LLM is not connected. Try refreshing the page.';
      _onResponse(message);
      return;
    }

    // Single prompt
    if (!chunkedMode) {
      console.log("Submitting prompt")
      generate(systemPrompt, prompt, (status: string) => _onResponse(status));
    }
    // Multiple prompts
    else {
      console.log("Chunking prompt")

      let task = '';
      let egoMap = new Map<string, string>();
      let eventMap = new Map<string, Set<string>>();

      const chunks = chunkString(prompt, MAX_CHARS);

      let startTime = performance.now();
      for (let idx = 0; idx < chunks.length; idx++) {
        // Get character perspective
        egos = await generate(CHARACTERS_SYSTEM_MESSAGE, chunks[idx], (status: string) => chunkedOutput(status), chunkedMode);

        egoMap = mergeEgosFromJSONStrings([egos], egoMap, ". ");
        _onResponse(egoMap);

        // Get events
        events = await generate(EVENTS_SYSTEM_MESSAGE, chunks[idx], (status: string) => chunkedOutput(status), chunkedMode, false);
        console.log("Events", events);


        // Update bar
        let percent = (idx + 1) / chunks.length;

        let endTime = performance.now();
        let elapsed = endTime - startTime;
        let remaining = (elapsed / percent) * (1 - percent);
        let remainingFmt = formatTime(remaining);

        if (_onProgress) { _onProgress(percent, task, remainingFmt) };

        await delay(100); // Delay for 100 ms so user input can be proceessed
      }

      // current = '';
    }

  } catch (e) {
    console.error('Error while generating response.', e);
    _onResponse('Error while generating response.');
  }
}