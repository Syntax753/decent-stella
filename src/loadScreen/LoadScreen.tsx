import {useState, useEffect} from "react";
import { ModelDeviceProblemsDialog, ModelDeviceProblem } from "decent-portal";

import styles from './LoadScreen.module.css';
import { init, startLoadingModel } from "./interactions/initialization";
import ProgressBar from '@/components/progressBar/ProgressBar';
import TopBar from '@/components/topBar/TopBar';
import ContentButton from "@/components/contentButton/ContentButton";

type Props = {
  onComplete: () => void;
}

function LoadScreen(props:Props) {
  const [percentComplete, setPercentComplete] = useState(0);
  const [isReadyToLoad, setIsReadyToLoad] = useState<boolean>(false);
  const [wasLoadCancelled, setWasLoadCancelled] = useState<boolean>(false);
  const [modalDialogName, setModalDialogName] = useState<string|null>(null);
  const [modelId, setModelId] = useState<string>('');
  const [currentTask, setCurrentTask] = useState('Loading');
  const [problems, setProblems] = useState<ModelDeviceProblem[]|null>(null);
  const {onComplete} = props;
  
  useEffect(() => {
    if (!isReadyToLoad) {
      init(setModelId, setProblems, setModalDialogName).then(setIsReadyToLoad);
      return;
    }
    startLoadingModel(modelId, setPercentComplete, setCurrentTask)
      .then((isInitialized) => { if (isInitialized) onComplete(); });
  }, [isReadyToLoad, modelId]);

  const statusContent = wasLoadCancelled ? (
      <div className={styles.cancelledMessage}>
        <p>Model loading was cancelled.</p>
        <p><ContentButton text='Try Again' onClick={() => window.location.reload()} /></p> 
      </div> 
    ) : (
      <div className={styles.progressBarContainer}>
            <ProgressBar percentComplete={percentComplete}/>
            {currentTask}
      </div>
    );
  
  return (
    <div className={styles.container}>
      <TopBar />
      <div className={styles.content}>
        {statusContent}
      </div>

      <ModelDeviceProblemsDialog 
        isOpen={modalDialogName === ModelDeviceProblemsDialog.name} 
        modelId={modelId}
        problems={problems} 
        onConfirm={() => {setModalDialogName(null); setIsReadyToLoad(true); }} 
        onCancel={() => {setModalDialogName(null); setWasLoadCancelled(true); }}
      />
    </div>
  );
}

export default LoadScreen;