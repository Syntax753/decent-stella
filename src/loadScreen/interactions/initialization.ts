import { connect } from "@/llm/llmUtil.ts";
import { findBestModel, ModelDeviceProblemsDialog, predictModelDeviceProblems } from "decent-portal";

let isInitialized = false;
let isInitializing = false;

// Format: Blah blah [3/45] blah blah
function _findPercentCompleteFromStatus(status:string):number|null {
  const leftBracketPos = status.indexOf('[');
  if (leftBracketPos === -1) return null;
  const divisorPos = status.indexOf('/', leftBracketPos+1);
  if (divisorPos === -1) return null;
  const rightBracketPos = status.indexOf(']', divisorPos+1);
  if (rightBracketPos === -1) return null;
  const leftValue = parseInt(status.substring(leftBracketPos+1, divisorPos));
  const rightValue = parseInt(status.substring(divisorPos+1, rightBracketPos));
  if (isNaN(leftValue) || isNaN(rightValue) || rightValue === 0) return null;
  return leftValue / rightValue;
}

// Returns true if model is ready to load, false if there are problems.
export async function init(setModelId:Function, setProblems:Function, setModalDialogName:Function):Promise<boolean> {
  const modelId = await findBestModel();
  setModelId(modelId);
  const problems = await predictModelDeviceProblems(modelId);
  if (!problems) return true;
  setProblems(problems);
  setModalDialogName(ModelDeviceProblemsDialog.name);
  return false;
}

export async function startLoadingModel(modelId:string, setPercentComplete:Function, setCurrenTask:Function):Promise<boolean> {
  if (isInitialized || isInitializing) return false;
  
  try {
    isInitializing = true;
    function _onStatusUpdate(status:string, percentComplete:number) {
      const statusPercentComplete = _findPercentCompleteFromStatus(status); // For WebLLM, it's better to parse from status text.
      percentComplete = Math.max(percentComplete, statusPercentComplete || 0);
      setPercentComplete(percentComplete);
      setCurrenTask(status);
    }

    await connect(modelId, _onStatusUpdate);
    isInitialized = true;
    return true;
  } catch(e) {
    console.error(e);
    return false;
  } finally {
    isInitializing = false;
  }
}