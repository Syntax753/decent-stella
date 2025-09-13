/*
  This module is an abstraction layer for LLM APIs.

  General Usage:
  * call connect() to initialize the connection.
  * call generate() to get a response for a prompt.
  * other APIs are there for setting system message, chat history, etc.
  
  There is just one connection type for now: WebLLM, but this is abstracted for future CDA updates that may add other LLM providers.
*/

import { updateModelDeviceLoadHistory, updateModelDevicePerformanceHistory } from "decent-portal";

import LLMConnection from "./types/LLMConnection";
import LLMConnectionState from "./types/LLMConnectionState";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { webLlmConnect, webLlmGenerate } from "./webLlmUtil";
import { getCachedPromptResponse, setCachedPromptResponse } from "./promptCache";

const UNSPECIFIED_MODEL_ID = 'UNSPECIFIED';

let theConnection:LLMConnection = {
  modelId: UNSPECIFIED_MODEL_ID,
  state: LLMConnectionState.UNINITIALIZED,
  webLLMEngine: null,
  serverUrl: null,
  connectionType: LLMConnectionType.NONE
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

function _inputCharCount(prompt:string):number {
  return prompt.length + 
    (messages.systemMessage ? messages.systemMessage.length : 0) + 
    messages.chatHistory.reduce((acc, curr) => acc + curr.content.length, 0);
}

/*
  Public APIs
*/

export function isLlmConnected():boolean {
  return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING;
}

// Useful for app code that needs to use model-specific prompts or has other model-specific behavior.
export function getConnectionModelId():string {
  if (theConnection.modelId = UNSPECIFIED_MODEL_ID) throw Error('Must connect before model ID can be known.');
  return theConnection.modelId;
}

export async function connect(modelId:string, onStatusUpdate:StatusUpdateCallback) {
  if (isLlmConnected()) return;
  theConnection.state = LLMConnectionState.INITIALIZING;
  theConnection.modelId = modelId;
  const startLoadTime = Date.now();
  if (!await webLlmConnect(theConnection.modelId, theConnection, onStatusUpdate)) {
    updateModelDeviceLoadHistory(theConnection.modelId, false);
    _clearConnectionAndThrow('Failed to connect to WebLLM.');
  }
  updateModelDeviceLoadHistory(theConnection.modelId, true, Date.now() - startLoadTime);
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

export async function generate(systemPrompt: string, prompt:string, onStatusUpdate:StatusUpdateCallback, chunkedMode: boolean = false, clearChat: boolean = true):Promise<string> {
  // const cachedResponse = getCachedPromptResponse(prompt); // If your app doesn't benefit from cached responses, just delete this block below.
  // if (cachedResponse) {
  //   onStatusUpdate(cachedResponse, 100);
  //   return cachedResponse;
  // }

  console.log(`Submitting prompt ${systemPrompt} / ${prompt.substring(0,50)}`);

  // let firstResponseTime = 0;
  // function _captureFirstResponse(status:string, percentComplete:number) {
  // if (!firstResponseTime) firstResponseTime = Date.now();
  //   onStatusUpdate(status, percentComplete);
  // }

  if (!isLlmConnected()) throw Error('LLM connection is not initialized.');
  if (theConnection.state !== LLMConnectionState.READY) throw Error('LLM is not in ready state.');
  console.log("Connected to LLM, generating...");

  if (clearChat) clearChatHistory();
  setSystemMessage(systemPrompt);

  theConnection.state = LLMConnectionState.GENERATING;

  let message = '';
  // let requestTime = Date.now();
  switch(theConnection.connectionType) {
    case LLMConnectionType.WEBLLM: message = await webLlmGenerate(theConnection, messages, prompt, onStatusUpdate, chunkedMode); break;
    default: throw Error('Unexpected');
  }
  // updateModelDevicePerformanceHistory(theConnection.modelId, requestTime, firstResponseTime, Date.now(), _inputCharCount(prompt), message.length);
  setCachedPromptResponse(prompt, message);
  theConnection.state = LLMConnectionState.READY;
  return message;
}


