import LLMConnection from "./types/LLMConnection";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";

import { addAssistantMessageToChatHistory, addUserMessageToChatHistory } from "./messageUtil";

import {
  CreateMLCEngine,
  ChatCompletionRequest,
  ChatCompletionMessageParam,
} from "@mlc-ai/web-llm";
import LLMMessage from "./types/LLMMessage";

// A safe way to convert from WebLLM-specific message format to the format used by the chat history. The two formats are the same as I write this, 
// but this function should catch breakages if the WebLLM format changes.
function _toChatCompletionMessages(llmMessages: LLMMessage[]): ChatCompletionMessageParam[] {
  return llmMessages.map(llmMessage => {
    let chatMessage: ChatCompletionMessageParam;
    const tool_call_id: string = llmMessage.tool_call_id ?? '';
    const content = llmMessage.content;
    switch (llmMessage.role) {
      case 'tool': chatMessage = { role: 'tool', content, tool_call_id }; break;
      case 'assistant': chatMessage = { role: 'assistant', content }; break;
      case 'user': chatMessage = { role: 'user', content }; break;
      case 'system': chatMessage = { role: 'system', content }; break;
      default: throw Error('Unexpected'); // Check for updates in WebLLM's ChatCompletionMessageParam.
    }
    return chatMessage;
  });
}

/*
  Public APIs
*/

export async function webLlmConnect(modelId: string, connection: LLMConnection, onStatusUpdate: StatusUpdateCallback): Promise<boolean> {
  try {
    connection.connectionType = LLMConnectionType.WEBLLM;
    connection.webLLMEngine = await CreateMLCEngine(
      modelId,
      { initProgressCallback: progress => onStatusUpdate(progress.text, progress.progress) }
    );
    return true;
  } catch (e) {
    console.error('Error while connecting to WebLLM.', e);
    return false;
  }
}

export async function webLlmGenerate(connection: LLMConnection, llmMessages: LLMMessages, systemPrompt: string, prompt: string, onStatusUpdate: StatusUpdateCallback, chunkedMode: boolean = false): Promise<string> {
  // console.log("WebLLM generate", llmMessages, systemPrompt, prompt);
  const engine = connection.webLLMEngine;
  if (!engine) throw Error('Unexpected');

  console.log("WebLLM engine", engine);
  // The `setSystemMessage` and `createChatHistory` combination was likely causing the system prompt's
  // content (including examples) to be merged into the user prompt, leading to the model
  // returning the examples as part of its response.
  // By constructing the message list directly, we ensure the system prompt is correctly
  // passed in a 'system' role message, separate from the 'user' role prompt.
  const messagesForApi: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...llmMessages.chatHistory,
    { role: 'user', content: prompt }
  ];
  const messages = _toChatCompletionMessages(messagesForApi);

  const request: ChatCompletionRequest = {
    n: 1,
    stream: true,
    seed: 0,
    messages,
    temperature: 0.0,
    extra_body: {
      "enable_thinking": false
    }
  }

  console.log("WebLLM request", request);

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
  // The full response is assembled from the stream. The `engine.getMessage()` call is from an older API
  // and is not needed with the chat completions API. It can also return stale or incorrect results.
  // messageText = await engine.getMessage();

  // The LLM can sometimes return markdown fences or other text around the JSON.
  // We will try to extract the JSON content and ensure it is a JSON array.
  const firstBracket = messageText.indexOf('[');
  const firstBrace = messageText.indexOf('{');
  let jsonStartIndex = -1;

  if (firstBracket === -1) {
    jsonStartIndex = firstBrace;
  } else if (firstBrace === -1) {
    jsonStartIndex = firstBracket;
  } else {
    jsonStartIndex = Math.min(firstBracket, firstBrace);
  }

  const lastBracket = messageText.lastIndexOf(']');
  const lastBrace = messageText.lastIndexOf('}');
  const jsonEndIndex = Math.max(lastBracket, lastBrace);

  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    let content = messageText.substring(jsonStartIndex, jsonEndIndex + 1);
    // If multiple JSON arrays are returned, merge them into a single array string.
    content = content.replace(/\]\s*\[/g, ',');
    messageText = content.startsWith('[') ? content : `[${content}]`;
  }

  onStatusUpdate(messageText, 1);
  if (!chunkedMode) {
    addAssistantMessageToChatHistory(llmMessages, messageText);
  }
  return messageText;
}