import LLMConnectionState from "./LLMConnectionState";
import LLMConnectionType from "./LLMConnectionType";

import * as webllm from "@mlc-ai/web-llm";

type LLMConnection = {
  state:LLMConnectionState,
  modelId:string,
  webLLMEngine:webllm.MLCEngineInterface|null,
  serverUrl:string|null,
  connectionType:LLMConnectionType
}

export default LLMConnection;