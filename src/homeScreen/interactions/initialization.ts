import { isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
import { STELLA_SYSTEM_MESSAGE } from "./prompt";
import LLMDevPauseDialog from "@/homeScreen/dialogs/LLMDevPauseDialog";
import { isServingLocally } from "@/developer/devEnvUtil";
import { LOAD_URL } from "@/common/urlUtil";

export async function init(setLocation:Function, setModalDialog:Function, systemMessage: string = STELLA_SYSTEM_MESSAGE) {
  setSystemMessage(systemMessage);
  
  if (!isLlmConnected()) {
    if (isServingLocally()) {
      setModalDialog(LLMDevPauseDialog.name); // Probably a hot reload on a dev server - ask user if should load LLM.
      return;
    }
    setLocation(LOAD_URL); // First arrival to screen with LLM not loaded. Go load it and come back.
  }
}