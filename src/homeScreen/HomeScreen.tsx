import WaitingEllipsis from '@/components/waitingEllipsis/WaitingEllipsis';
import styles from './HomeScreen.module.css';
import { init } from "./interactions/initialization";
import { GENERATING, submitPrompt } from "./interactions/prompt";
import ContentButton from '@/components/contentButton/ContentButton';
import { useEffect, useState } from "react";
import LLMDevPauseDialog from './dialogs/LLMDevPauseDialog';
import { useLocation } from 'wouter';
import { LOAD_URL } from '@/common/urlUtil';

import { formatMapToString } from "@/data/conversion";

function HomeScreen() {
  // Output
  const [bardIntroText, setBardIntroText] = useState<string>('The Bard beckons your to her table');
  const [characterResponseText, setCharacterResponseText] = useState<string>('');

  const [charactersEgoText, setCharactersEgoText] = useState<string>('');
  const [characterEgo, setCharacterEgo] = useState<string>('');

  // Data Structs
  const [egoMap, setEgoMap] = useState<Map<string, string>>(new Map<string, string>());

  // UX
  const [, setLocation] = useLocation();
  const [modalDialog, setModalDialog] = useState<string | null>(null);
  const [taleSelection, setTaleSelection] = useState<string>('');
  const [characterSelection, setCharacterSelection] = useState<string>('');
  const [characterPrompt, setCharacterPrompt] = useState<string>('');

  // const [eventMap, setEventMap] = useState<Map<string, string>>(new Map<string, string>());

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
Name all the characters in the story along with their personality.
Do not include characters that do not have a personality.

1. Collect the character and personality from the story and populate the json.
2. The fields in the json are
  - Name: This is the character's name
  - Ego: This is the character's personality

- Example 1:

{"name":"The Minotaur","ego":"Very friendly and likes apples"}
{"name":"Icarus","ego":"Loves flying and sunny days" }

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

  // UI Updates
  function _onBardResponse(text: string) {
    setBardIntroText(text);
  }

  // Data Structure updates
  function _onCharactersEgoResponse(ego: string | Map<string, string>) {
    if (typeof ego === 'string') {
      setCharactersEgoText(ego);
    } else {
      setEgoMap(ego);
      setCharactersEgoText(formatMapToString(ego));
    }
  }

  // Data Structure updates
  function _onCharacterResponse(text: string) {
    setCharacterResponseText(text);
  }

  

  const bardIntroDOM = bardIntroText === GENERATING ? <p>The Bard beckons you to her table<WaitingEllipsis /></p> : <p>{bardIntroText}</p>
  // const charactersEgoDOM = charactersEgoText === GENERATING ? <p>The Bard picks up her lute<WaitingEllipsis /></p> : <p>{charactersEgoText}</p>
  // const character

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>Welcome the Timeless Tavern where the Yarn of Yesteryear is Spun</h1></div>
      <div className={styles.content}>

        {bardIntroDOM}
        <br />
        <ContentButton text="Approach Table" onClick={() => submitPrompt(BARD_PROMPT, BARD_SYSTEM_MESSAGE, _onBardResponse)} />
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
                // TODO: Update the dropdown to match the 'top' default selection value. Doesn't update currently
                setCharactersEgoText('');
              } else {
                egoMap.clear();
                setTaleSelection(selectedTale);
                const taleFileName = taleMap[selectedTale];
                if (taleFileName) {
                  fetch(`/tales/${taleFileName}`)
                    .then(response => response.text())
                    .then((taleContent) => {
                      submitPrompt(taleContent, CHARACTERS_SYSTEM_MESSAGE, _onCharactersEgoResponse, true);
                    })
                    .catch(error => console.error('Error loading tale:', error));
                }
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
        <br />
        {egoMap.size > 0 && (
          <p>
            <label htmlFor="characterSelection">The Hall of Heroes</label><br /><br />
            {<select
              id="characterSelection"
              value={characterSelection}
              onChange={(e) => { 
                const selectedCharacter = e.target.value;
                setCharacterSelection(selectedCharacter);

                // Reset
                setCharacterResponseText('');
                setCharacterPrompt('');
                setCharacterEgo('');

                let characterEgo = egoMap.get(selectedCharacter);
                if (!characterEgo) {
                  console.error('Missing ego', selectedCharacter);
                } else {

                  setCharacterEgo(characterEgo);
                }
              }
              }>
              <option value="">Select your Hero</option>
              {egoMap.keys().map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>}
            {characterEgo && <input type="text" className={styles.promptBox} placeholder={characterEgo} value={characterPrompt} onChange={(e) => setCharacterPrompt(e.target.value)}/>}
            {characterPrompt && <ContentButton text="Send" onClick={() => submitPrompt("Your name is "+characterSelection+". This is your personality: "+characterPrompt, characterEgo, _onCharacterResponse)}/>}
            {characterResponseText && <p>{characterResponseText}</p>}

          </p>)}
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