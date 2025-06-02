import LLMConnection from "./types/LLMConnection";
import LLMConnectionState from "./types/LLMConnectionState";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { connectToOllama, generateOllama } from "./ollamaUtil";
import { connectToWebLLM, generateWebLLM } from "./webLlmUtil";
import { isServingLocally } from "@/developer/devEnvUtil";

let theConnection: LLMConnection = {
  state: LLMConnectionState.UNINITIALIZED,
  webLLMEngine: null,
  serverUrl: null,
  connectionType: LLMConnectionType.NONE
}

let messages: LLMMessages = {
  chatHistory: [],
  maxChatHistorySize: 100,
  systemMessage: null
};

let savedMessages: LLMMessages | null = null;

export function isInitialized(): boolean { return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING; }

export async function init(onStatusUpdate: StatusUpdateCallback) {
  if (isInitialized()) return;
  theConnection.state = LLMConnectionState.INITIALIZING;
  const connectionSuccess = (
    (isServingLocally() && await connectToOllama(theConnection, onStatusUpdate)) // Better option for local development because doesn't need to load the model to GPU on each reload.
    || await connectToWebLLM(theConnection, onStatusUpdate) // Better option for production because browsers tend not to support calling local servers without hacking/advanced config.
  );
  if (!connectionSuccess) {
    theConnection.webLLMEngine = null;
    theConnection.serverUrl = null;
    theConnection.connectionType = LLMConnectionType.NONE;
    theConnection.state = LLMConnectionState.INIT_FAILED;
    throw new Error('Failed to connect to LLM.');
  }
  theConnection.state = LLMConnectionState.READY;
}

export function isLlmConnected(): boolean {
  return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING;
}

export function setSystemMessage(message: string | null) {
  messages.systemMessage = message;
}

export function setChatHistorySize(size: number) {
  messages.maxChatHistorySize = size;
}

export function saveChatConfiguration() {
  savedMessages = { ...messages };
}

export function restoreChatConfiguration() {
  if (!savedMessages) throw Error('No saved configuration.');
  messages = { ...savedMessages };
}

export function clearChatHistory() {
  messages.chatHistory = [];
}

export async function generate(prompt: string, systemMessage: string, onStatusUpdate: StatusUpdateCallback, chunkedMode: boolean = false): Promise<string> {

  if (!isInitialized()) throw Error('LLM connection is not initialized.');

  // console.info('system', systemMessage);
  // console.info('prompt', prompt)

  // Wait for the LLM to be in the READY state
  await waitForLLMReady();

  clearChatHistory();
  setSystemMessage(systemMessage);

  // if (theConnection.state !== LLMConnectionState.READY) throw Error('LLM is not in ready state.');
  theConnection.state = LLMConnectionState.GENERATING;
  let message = '';

  switch (theConnection.connectionType) {
    case LLMConnectionType.WEBLLM: message = await generateWebLLM(theConnection, messages, prompt, onStatusUpdate, chunkedMode); break;
    case LLMConnectionType.OLLAMA: message = await generateOllama(theConnection, messages, prompt, onStatusUpdate); break;
    default: throw Error('Unexpected');
  }
  theConnection.state = LLMConnectionState.READY;
  return message;
}

async function waitForLLMReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (theConnection.state === LLMConnectionState.READY) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (theConnection.state === LLMConnectionState.READY) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50); // Check every 50 milliseconds (adjust as needed)

    // Optional: Add a timeout to prevent indefinite waiting
    setTimeout(() => {
      clearInterval(checkInterval);
      console.error('Timeout waiting for LLM to be ready.');
      reject(new Error('Timeout waiting for LLM to be ready.'));
    }, 100000); // Wait for 100 seconds
  });
}