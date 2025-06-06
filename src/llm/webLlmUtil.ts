import LLMConnection from "./types/LLMConnection";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";

import { addAssistantMessageToChatHistory, addUserMessageToChatHistory, createChatHistory } from "./messageUtil";

import {
  CreateMLCEngine,
  ChatCompletionRequest,
  ChatCompletionMessageParam,
} from "@mlc-ai/web-llm";
import LLMMessage from "./types/LLMMessage";

export const WEBLLM_MODEL = "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k";

// A safe way to convert from WebLLM-specific message format to the format used by the chat history. The two formats are the same as I write this, 
// but this function should catch breakages if the WebLLM format changes.
function _toChatCompletionMessages(llmMessages:LLMMessage[]):ChatCompletionMessageParam[] {
  return llmMessages.map(llmMessage => {
    let chatMessage:ChatCompletionMessageParam;
    const tool_call_id:string = llmMessage.tool_call_id ?? '';
    const content = llmMessage.content;
    switch(llmMessage.role) {
      case 'tool': chatMessage = {role:'tool', content, tool_call_id}; break;
      case 'assistant': chatMessage = {role:'assistant', content}; break;
      case 'user': chatMessage = {role:'user', content}; break;
      case 'system': chatMessage = {role:'system', content}; break;
      default: throw Error('Unexpected'); // Check for updates in WebLLM's ChatCompletionMessageParam.
    }
    return chatMessage;
  });
}

/*
  Public APIs
*/

export async function webLlmConnect(connection:LLMConnection, onStatusUpdate:StatusUpdateCallback):Promise<boolean> {
  try {
    connection.connectionType = LLMConnectionType.WEBLLM;
    connection.webLLMEngine = await CreateMLCEngine(
      WEBLLM_MODEL,
      { initProgressCallback: progress => onStatusUpdate(progress.text, progress.progress) }
    );
    return true;
  } catch(e) {
    console.error('Error while connecting to WebLLM.', e);
    return false;
  }
}

export async function webLlmGenerate(connection:LLMConnection, llmMessages:LLMMessages, prompt:string, onStatusUpdate:StatusUpdateCallback, chunkedMode:boolean=false):Promise<string> {
  const engine = connection.webLLMEngine;
  if (!engine) throw Error('Unexpected');

  const messages = _toChatCompletionMessages(createChatHistory(llmMessages, prompt));
  const request:ChatCompletionRequest = {
    n:1,
    stream: true,
    seed: 0,
    messages,
    temperature: 0.0
  };


  if (!chunkedMode) {
    addUserMessageToChatHistory(llmMessages, prompt);
  }

  const asyncChunkGenerator = await engine.chat.completions.create(request);
  let messageText = '';
  for await (const chunk of asyncChunkGenerator) {
    if (chunk.choices[0].delta.content) {
      messageText += chunk.choices[0].delta.content; // Last chunk has undefined content
    }
    onStatusUpdate(messageText, 0);
  }
  messageText = await engine.getMessage();
  
  onStatusUpdate(messageText, 1);
    if (!chunkedMode) {
    addAssistantMessageToChatHistory(llmMessages, messageText);
  }
  return messageText;
}