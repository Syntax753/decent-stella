import { isLlmConnected } from "@/llm/llmUtil";
import LLMDevPauseDialog from "@/homeScreen/dialogs/LLMDevPauseDialog";
import { isServingLocally } from "@/developer/devEnvUtil";
import { LOAD_URL } from "@/common/urlUtil";

// function sleep(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

export async function init(setLocation:Function, setModalDialog:Function) {
  console.log("Init LLM")
  // setSystemMessage(STELLA_SYSTEM_MESSAGE);
  
  // while (!isLlmConnected) {
  //   console.log("Retry LLM")
  //   sleep(1000);
  // }

  if (!isLlmConnected()) {
    if (isServingLocally()) {
      setModalDialog(LLMDevPauseDialog.name); // Probably a hot reload on a dev server - ask user if should load LLM.
      return;
    }
    setLocation(LOAD_URL); // First arrival to screen with LLM not loaded. Go load it and come back.
  } else {
    console.log("LLM Connected")
  }
}