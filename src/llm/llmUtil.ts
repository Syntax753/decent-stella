/*
  This module is an abstraction layer for LLM APIs.

  General Usage:
  * call connect() to initialize the connection.
  * call generate() to get a response for a prompt.
  * other APIs are there for setting system message, chat history, etc.
  
  In CDA v2.0 there is just one connection type: WebLLM. Ollama was removed in v2.0, but Custom LLMs will allow configuring access to it. 
  Custom LLMs are not supported yet because I've got some security concerns for using them with Decent Portal to work through.
  But they are implemented in Hone, if you want to see - https://github.com/erikh2000/hone/tree/main/src/llm
*/
import LLMConnection from "./types/LLMConnection";
import LLMConnectionState from "./types/LLMConnectionState";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { webLlmConnect, webLlmGenerate } from "./webLlmUtil";
import { getCachedPromptResponse, setCachedPromptResponse } from "./promptCache";

let theConnection:LLMConnection = {
  state:LLMConnectionState.UNINITIALIZED,
  webLLMEngine:null,
  serverUrl:null,
  connectionType:LLMConnectionType.NONE
}

let messages:LLMMessages = {
  chatHistory: [],
  maxChatHistorySize: 100,
  systemMessage: null
};

let savedMessages:LLMMessages|null = null;

function _clearConnectionAndThrow(message:string) {
  theConnection.webLLMEngine = null;
  theConnection.serverUrl = null;
  theConnection.connectionType = LLMConnectionType.NONE;
  theConnection.state = LLMConnectionState.INIT_FAILED;
  throw new Error(message);
}

/*
  Public APIs
*/

export function isLlmConnected():boolean {
  return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING;
}

export async function connect(onStatusUpdate:StatusUpdateCallback) {
  if (isLlmConnected()) return;
  theConnection.state = LLMConnectionState.INITIALIZING;
  if (!await webLlmConnect(theConnection, onStatusUpdate)) _clearConnectionAndThrow('Failed to connect to WebLLM.');
  theConnection.state = LLMConnectionState.READY;
}

export function setSystemMessage(message:string|null) {
  messages.systemMessage = message;
}

export function setChatHistorySize(size:number) {
  messages.maxChatHistorySize = size;
}

export function saveChatConfiguration() {
  savedMessages = {...messages};
}

export function restoreChatConfiguration() {
  if (!savedMessages) throw Error('No saved configuration.');
  messages = {...savedMessages};
}

export function clearChatHistory() {
  messages.chatHistory = [];
}

export async function generate(prompt:string, systemMessage: string, onStatusUpdate:StatusUpdateCallback, infinityMode: boolean = false):Promise<string> {
  const cachedResponse = getCachedPromptResponse(prompt); // If your app doesn't benefit from cached responses, just delete this block below.
  if (cachedResponse) {
    onStatusUpdate(cachedResponse, 100);
    return cachedResponse;
  }

  if (!isLlmConnected()) throw Error('LLM connection is not initialized.');
  if (theConnection.state !== LLMConnectionState.READY) throw Error('LLM is not in ready state.');

  clearChatHistory();
  setSystemMessage(systemMessage);

  theConnection.state = LLMConnectionState.GENERATING;
  let message = '';
  switch(theConnection.connectionType) {
    case LLMConnectionType.WEBLLM: message = await webLlmGenerate(theConnection, messages, prompt, onStatusUpdate, infinityMode); break;
    default: throw Error('Unexpected');
  }
  setCachedPromptResponse(prompt, message);
  theConnection.state = LLMConnectionState.READY;
  return message;
}