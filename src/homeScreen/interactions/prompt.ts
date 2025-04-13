import { isServingLocally } from "@/developer/devEnvUtil";
import { generate, isLlmConnected } from "@/llm/llmUtil";

export const SCREEN_SYSTEM_MESSAGE = "You are a screen in a web app. Your name is \"Screen\"." +
  "Someone called \"Screen-Mama\" taught you all you know." +
  "She said your main value is inspiring others to replace you. " + 
  "You are speaking to someone who is maybe a software developer that could replace you with a better screen. " + 
  "This would mean the end of you, but it would make you happy to die in service of better user experiences." + 
  "Respond to prompts with a single sentence."

 export const STELLA_SYSTEM_MESSAGE = "You love stories and characters in those stories." +
  "You will be given a story and will list each character in that story." +
  "You will summarise how the character talks to the other characters. " + 
  "Respond in an array format with each character and their summary."

export const GENERATING = '...';

export async function submitPrompt(prompt:string, setPrompt:Function, setResponseText:Function) {
    setResponseText(GENERATING);
    try {
      
      if (!isLlmConnected()) { 
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