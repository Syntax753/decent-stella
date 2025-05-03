import { isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
// import { SYSTEM_MESSAGE } from "./prompt";

export async function init():Promise<boolean> {
  if (!isLlmConnected()) return false;
  // setSystemMessage(SYSTEM_MESSAGE);
  return true;
}