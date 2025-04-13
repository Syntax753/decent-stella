import WaitingEllipsis from '@/components/waitingEllipsis/WaitingEllipsis';
import styles from './HomeScreen.module.css';
import eyesPng from './images/eyes.png';
import { init } from "./interactions/initialization";
import { GENERATING, submitPrompt } from "./interactions/prompt";

import ContentButton from '@/components/contentButton/ContentButton';
import { useEffect, useState } from "react";
import LLMDevPauseDialog from './dialogs/LLMDevPauseDialog';
import { useLocation } from 'wouter';
import { LOAD_URL } from '@/common/urlUtil';

function HomeScreen() {
  const [prompt, setPrompt] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [modalDialog, setModalDialog] = useState<string|null>(null);
  const [eyesState, setEyesState] = useState<string>('');
  const [taleSelection, setTaleSelection] = useState<string>('');
  const [, setLocation] = useLocation();

  const taleMap: { [key: string]: string } = {
    "the-fellowship-of-the-ring": "the-fellowship-of-the-ring.txt",
    "the-hobbit": "the-hobbit.txt",
  };
  
  useEffect(() => {
    init(setLocation, setModalDialog).then(() => { });
  }, []);

  function onKeyDown(e:React.KeyboardEvent<HTMLInputElement>) {
    if(e.key === 'Enter' && prompt !== '') submitPrompt(prompt, setPrompt, _onRespond);
  }

  function _onRespond(text:string) {
    setResponseText(text);
    const stateNo = Math.floor(Math.random() * 5) + 1;
    setEyesState(styles[`eyesState${stateNo}`]);
  }

  const response = responseText === GENERATING ? <p>The Bard picks up her lute<WaitingEllipsis/></p> : <p>{responseText}</p>
  
  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Welcome the Timeless Tavern where the Yarn of Yesteryear is Spun</h1></div>
      <div className={styles.content}>
        {/* <img src={eyesPng} alt="Eyes" className={`${styles.eyes} ${eyesState}`}/> */}
       
        <p>
          <label htmlFor="taleSelection">Tale:</label>
            <select 
            id="taleSelection" 
            value={taleSelection} 
            onChange={(e) => {
              const selectedTale = e.target.value;
              setTaleSelection(selectedTale);
              const taleFileName = taleMap[selectedTale];
              if (taleFileName) {
                fetch(`/tales/${taleFileName}`)
                  .then(response => response.text())
                  .then((taleContent) => {
                  submitPrompt(taleContent, setPrompt, _onRespond);
                  })
                  .catch(error => console.error('Error loading tale:', error));
              }
            }}
            >
            <option value="">Select Your Tale of Yore</option>
            <option value="the-fellowship-of-the-ring">The Fellowship of the Ring</option>
            <option value="the-hobbit">The Hobbit</option>
            </select>
        </p>

        {/* <p><input type="text" className={styles.promptBox} placeholder="Say anything to this screen" value={prompt} onKeyDown={_onKeyDown} onChange={(e) => setPrompt(e.target.value)}/>
        <ContentButton text="Send" onClick={() => submitPrompt(prompt, setPrompt, _onRespond)} /></p> */}
        {response}
      </div>

      <LLMDevPauseDialog isOpen={modalDialog === LLMDevPauseDialog.name} onConfirm={() => setLocation(LOAD_URL)} onCancel={() => setModalDialog(null)} />
    </div>
  );
}

export default HomeScreen;
