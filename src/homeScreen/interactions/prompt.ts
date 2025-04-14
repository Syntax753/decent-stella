import { isServingLocally } from "@/developer/devEnvUtil";
import { generate, isLlmConnected, setSystemMessage } from "@/llm/llmUtil";

export const STELLA_SYSTEM_MESSAGE = "You are a female bard in The Timeless Tavern where the Yarn of Yesteryear is Spun."+
  "You are a storyteller and you are telling a story to the audience. " +
  "You are carrying a help with telling the story." +
  "Your goal is to entertain the audience with your story. " 

export const GENERATING = '...';

export async function submitPrompt(prompt:string, setPrompt:Function, setResponseText:Function, systemMessage:string = STELLA_SYSTEM_MESSAGE) {
    setSystemMessage(systemMessage);  
    setResponseText(GENERATING);
    try {
      
      if (!isLlmConnected()) { 
        console.log("Generate LLM not connected")
        const message = isServingLocally() 
        ? `LLM is not connected. You're in a dev environment where this is expected (hot reloads, canceling the LLM load). You can refresh the page to load the LLM.`
        : 'LLM is not connected. Try refreshing the page.';
        setResponseText(message); 
        return; 
      }
      generate(prompt, (status:string) => setResponseText(status));
      setPrompt('');
    } catch(e) {
      console.error('Error while generating response.', e);
      setResponseText('Error while generating response.');
    }
}