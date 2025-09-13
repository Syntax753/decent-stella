import LLMMessage from "./LLMMessage";

type LLMMessages = {
  chatHistory:LLMMessage[],
  maxChatHistorySize:number;
  systemMessage:string|null;
  assistantMessage:string|null;
}

export default LLMMessages;