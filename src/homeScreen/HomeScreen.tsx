import WaitingEllipsis from '@/components/waitingEllipsis/WaitingEllipsis';
import styles from './HomeScreen.module.css';
import eyesPng from './images/eyes.png';
import { init } from "./interactions/initialization";
import { GENERATING, submitPrompt } from "./interactions/prompt";

import DangerousHtml from '@/components/dangerousHtml/DangerousHtml';
import ContentButton from '@/components/contentButton/ContentButton';
import { useEffect, useState } from "react";
import LLMDevPauseDialog from './dialogs/LLMDevPauseDialog';
import { useLocation } from 'wouter';
import { LOAD_URL } from '@/common/urlUtil';

function HomeScreen() {
  const [prompt, setPrompt] = useState<string>('');
  const [bardIntroText, setBardIntroText] = useState<string>('The Bard beckons your to her table');
  const [responseText, setResponseText] = useState<string>('');
  const [modalDialog, setModalDialog] = useState<string | null>(null);
  const [eyesState, setEyesState] = useState<string>('');
  const [taleSelection, setTaleSelection] = useState<string>('');
  const [, setLocation] = useLocation();

  const taleMap: { [key: string]: string } = {
    "the-story-of-syntax-and-the-little-dog": "the-story-of-syntax-and-the-little-dog.txt",
    "the-famous-five-on-treasure-island": "the-famous-five-on-treasure-island.txt",
    "the-fellowship-of-the-ring": "the-fellowship-of-the-ring.txt",
    "the-raven": "the-raven.txt",
  };

  const BARD_SYSTEM_MESSAGE = "You love telling stories. " +
    "You are carrying a lute and are sitting in the Timeless Tavern. " +
    "An adventurer enters the tavern and sits at a nearby table."

  const BARD_PROMPT =
    "Tell a single limerick about heroes and dragons and epic tales. " +
    "Invite the traveller to your table " +
    "Format the output using markdown. "

  const CHARACTERS_SYSTEM_MESSAGE = `
Name all the characters in the story along with their personality in a json object.
Do not include characters that do not have a personality.

1. Collect the character and personality from the story and populate the json.
2. The fields in the json are
  - Name: This is the character's name
  - Ego: This is the character's personality

- Example 1:

{"name":"The Minotaur","ego":"Very friendly and likes apples"}
{"name":"Icarus", "ego":"Loves flying and sunny days" }

- Example 2:

{"name":"Mary","ego":"Quite contrary and loves silver bells"}
{"name":"Humpty","ego":"Loves eating omelettes"}

- Example 3:

{"name":"Beethro","ego":"Enjoys exploring dangerous rooms"}
{"name":"Halp","ego":"Causes trouble whereever he goes - but is helpful too"}

- Do not provide an introduction.
- Only respond with json objects.
- Check for and correct any syntax errors in the json format.
- If a character doesn't have specific details about their personalities, don't include them.
`

  const EVENTS_SYSTEM_MESSAGE =
    "You will be given a story and will list each event in that story. " +
    "Describe every event involving 2 or more people and list those who took part in it. " +
    "For example " +
    "[Going to the school]|Peter,Alice [Picking up the shopping]|Suzette [Buying a car]|Jonathan " +
    "Do not include an introduction. " +
    "Do not include any other information. "

  const CHARACTERS_EVENTS_SYSTEM_MESSAGE =
    "You will be given a story and will list each character in that story. " +
    "Please respond with just the name of the character and their attitudes. " +
    "For example " +
    "[John]|Very friendly and likes apples [Mary]|Very contrary and likes the sunrise [Paul]|Local blacksmith who enjoys long walks " +
    "Do not include an introduction. " +
    "Do not include any other information. " +
    "Then describe every event involving 2 or more people and list those who took part in it. " +
    "For example " +
    "[Going to the school]|Peter,Alice [Picking up the shopping]|Suzette [Buying a car]|Jonathan"

  useEffect(() => {
    init(setLocation, setModalDialog).then(() => { });
  })

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && prompt !== '') submitPrompt(prompt, setPrompt, _onRespond);

  }

  function _onRespond(text: string) {
    setResponseText(text);
    const stateNo = Math.floor(Math.random() * 5) + 1;
    setEyesState(styles[`eyesState${stateNo}`]);
  }

  function _onBardIntro(text: string) {
    setBardIntroText(text);
  }

  const bardIntro = bardIntroText === GENERATING ? <p>The Bard beckons you to her table<WaitingEllipsis /></p> : <p>{bardIntroText}</p>
  const response = responseText === GENERATING ? <p>The Bard picks up her lute<WaitingEllipsis /></p> : <p>{responseText}</p>

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Welcome the Timeless Tavern where the Yarn of Yesteryear is Spun</h1></div>
      <div className={styles.content}>
        {bardIntro}<ContentButton text="Approach Table" onClick={() => submitPrompt(BARD_PROMPT, setBardIntroText, _onBardIntro, BARD_SYSTEM_MESSAGE)} />
        <br />
        <br />
        <br />
        <p>
          <label htmlFor="taleSelection">Tales of Yore</label><br /><br />
          {<select
            id="taleSelection"
            value={taleSelection}
            onChange={(e) => {
              const selectedTale = e.target.value;
              if (selectedTale === 'default') {
                setResponseText('');
                return;
              }
              setTaleSelection(selectedTale);
              const taleFileName = taleMap[selectedTale];
              if (taleFileName) {
                fetch(`/tales/${taleFileName}`)
                  .then(response => response.text())
                  .then((taleContent) => {
                    submitPrompt(taleContent, setPrompt, _onRespond, CHARACTERS_SYSTEM_MESSAGE);
                  })
                  .catch(error => console.error('Error loading tale:', error));
              }
            }}
          >
            <option value="default">Select your journey</option>
            <option value="the-story-of-syntax-and-the-little-dog">The Story of Syntax and the Little Dog (Syntax)</option>
            <option value="the-famous-five-on-treasure-island">The Famous Five on Treasure Island (Blyton)</option>
            <option value="the-fellowship-of-the-ring">The Fellowship of the Ring (Tolkien)</option>
            <option value="the-raven">The Raven (Poe)</option>
          </select>}
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








// const BARD_PROMPT =
//   "Introduce the tavern to the traveller and sing a song of mighty deeds and heroes. " +
//   "The song should be in the form of a limerick. " +
//   "Format the output using markdown. " +
//   "Talk of yourself in the 3rd person as The Bard. " +
//   "Put a newline character after each sentence"