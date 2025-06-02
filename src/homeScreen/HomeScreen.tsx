import WaitingEllipsis from '@/components/waitingEllipsis/WaitingEllipsis';
import styles from './HomeScreen.module.css';
import { init } from "./interactions/initialization";
import { GENERATING, submitPrompt } from "./interactions/prompt";
import ContentButton from '@/components/contentButton/ContentButton';
import { useEffect, useState } from "react";

import LoadScreen from '@/loadScreen/LoadScreen';
import TopBar from '@/components/topBar/TopBar';

// Custom Stella
import { formatMapToString } from "@/data/conversion";
import ProgressBar from '@/components/progressBar/ProgressBar';

function HomeScreen() {
  // Output
  const [bardIntroText, setBardIntroText] = useState<string>('The Bard beckons your to her table');
  const [characterResponseText, setCharacterResponseText] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [_, setCharactersEgoText] = useState<string>('');
  const [characterEgo, setCharacterEgo] = useState<string>('');

  // Data Structs
  const [egoMap, setEgoMap] = useState<Map<string, string>>(new Map<string, string>());

  // UX
  // const [modalDialog, setModalDialog] = useState<string | null>(null);
  const [taleSelection, setTaleSelection] = useState<string>('');
  const [characterSelection, setCharacterSelection] = useState<string>('');
  const [characterPrompt, setCharacterPrompt] = useState<string>('');

  // Progress bar
  const [percentComplete, setPercentComplete] = useState<number>(0.0);
  const [estimateComplete, setEstimateComplete] = useState<string>('');
  const [currentTask, setCurrentTask] = useState<string>('');

  const taleMap: { [key: string]: string } = {
    "the-story-of-syntax-and-the-little-dog": "the-story-of-syntax-and-the-little-dog.txt",
    "the-famous-five-on-treasure-island": "the-famous-five-on-treasure-island.txt",
    "the-fellowship-of-the-ring": "the-fellowship-of-the-ring.txt",
    "the-raven": "the-raven.txt",
  };

  const BARD_SYSTEM_PROMPT = "You love telling stories. " +
    "You are carrying a lute and are sitting in the Timeless Tavern. " +
    "An adventurer enters the tavern and sits at a nearby table."

  const BARD_PROMPT =
    "Tell a single limerick about heroes and dragons and epic tales. " +
    "Invite the traveller to your table " +
    "Format the output using markdown. "

    // const EVENTS_SYSTEM_MESSAGE =
  //   "You will be given a story and will list each event in that story. " +
  //   "Describe every event involving 2 or more people and list those who took part in it. " +
  //   "For example " +
  //   "[Going to the school]|Peter,Alice [Picking up the shopping]|Suzette [Buying a car]|Jonathan " +
  //   "Do not include an introduction. " +
  //   "Do not include any other information. "

  // const CHARACTERS_EVENTS_SYSTEM_MESSAGE =
  //   "You will be given a story and will list each character in that story. " +
  //   "Please respond with just the name of the character and their attitudes. " +
  //   "For example " +
  //   "[John]|Very friendly and likes apples [Mary]|Very contrary and likes the sunrise [Paul]|Local blacksmith who enjoys long walks " +
  //   "Do not include an introduction. " +
  //   "Do not include any other information. " +
  //   "Then describe every event involving 2 or more people and list those who took part in it. " +
  //   "For example " +
  //   "[Going to the school]|Peter,Alice [Picking up the shopping]|Suzette [Buying a car]|Jonathan"

  useEffect(() => {
    if (isLoading) return;

    init().then(isLlmConnected => {
      if (!isLlmConnected) setIsLoading(true);
    });
  }, [isLoading]);

  if (isLoading) return <LoadScreen onComplete={() => setIsLoading(false)} />;

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

  function _onProgressBarUpdate(percent: number, remainingFmt: string = '') {
    // console.log('Progress Bar', percent, task, remainingFmt);
    setPercentComplete(percent);
    // setCurrentTask(task);
    if (percent === 1) {
      setEstimateComplete('The Bard puts down her Lute, as the Story has Come To Be in The Timeless Tavern...');
    } else {
      // console.log('Remaining', remainingFmt);
      setEstimateComplete(remainingFmt);
    }
  }

  // Handler for submitting the character prompt
  const handleCharacterPromptSubmit = () => {
    if (!characterPrompt.trim()) { // Prevent submitting empty or whitespace-only prompts
      console.log("Character prompt is empty. Not submitting.");
      return;
    }

    const systemPrompt = `Your name is ${characterSelection} and you are ${characterEgo}.`;
    console.log("System prompt: ", systemPrompt);
    console.log("Prompt: ", characterPrompt);
    submitPrompt(
      systemPrompt,
      characterPrompt,
      _onCharacterResponse
    );
  };
  const bardIntroDOM = bardIntroText === GENERATING ? <p>The Bard beckons you to her table<WaitingEllipsis /></p> : <p>{bardIntroText}</p>
  // const charactersEgoDOM = charactersEgoText === GENERATING ? <p>The Bard picks up her lute<WaitingEllipsis /></p> : <p>{charactersEgoText}</p>
  // const character

  return (
    <div className={styles.container}>
      <TopBar />
      <div className={styles.header}><h1>Welcome the Timeless Tavern where the Yarn of Yesteryear is Spun</h1></div>
      <div className={styles.content}>

        {bardIntroDOM}
        <br />
        <ContentButton text="Approach Table" onClick={() => submitPrompt(BARD_SYSTEM_PROMPT, BARD_PROMPT, _onBardResponse)} />
        <br />
        <br />
        <hr />
        <br />

        {/* Tale Select */}
        <label htmlFor="taleSelection">Tales of Yore</label><br /><br />
        {<select
          id="taleSelection"
          value={taleSelection}
          onChange={(e) => {

            // Init
            const selectedTale = e.target.value;
            const selectElement = e.target as HTMLSelectElement;
            const selectedIndex = selectElement.selectedIndex;
            const selectedTaleTitle = selectElement.options[selectedIndex].text;

            // Init Progress Bar
            setCurrentTask('The Bard picks up her Lute, and Sings the Tale of ' + selectedTaleTitle);

            if (selectedTale === 'default') {
              // TODO: Update the dropdown to match the 'top' default selection value. Doesn't update currently
              setCharactersEgoText('');
            } else {
              egoMap.clear();
              setTaleSelection(selectedTale);
              setPercentComplete(0.0);
              setEstimateComplete('');

              setCharacterResponseText('');
              setCharacterPrompt('');
              setCharacterEgo('');
              setCharactersEgoText('');   
                         
              const taleFileName = taleMap[selectedTale];
              if (taleFileName) {
                fetch(`/tales/${taleFileName}`)
                  .then(response => response.text())
                  .then((taleContent) => {
                    submitPrompt('', taleContent, _onCharactersEgoResponse, true, _onProgressBarUpdate);
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

        <br />
        <br />
        {/* Character Select */}

          {egoMap.size > 0 && (

            <><label htmlFor="characterSelection">The Hall of Heroes</label><br /><br /><select
              id="characterSelection"
              value={characterSelection}
              onChange={(e) => {
                const selectedCharacter = e.target.value;
                setCharacterSelection(selectedCharacter);

                // Reset
                setCharacterResponseText('');
                setCharacterPrompt('');
                setCharacterEgo('');
                setCharactersEgoText('');

                let characterEgo = egoMap.get(selectedCharacter);
                if (!characterEgo) {
                  console.error('Missing ego', selectedCharacter);
                } else {

                  setCharacterEgo(characterEgo);
                }
              }}>
              <option value="">Select your Hero</option>
              {Array.from(egoMap.keys()).map(name => (
                <option key={name} value={name}>{name}</option>))}
            </select></>
          )}

          {characterEgo && (
            <>
              <input
                type="text"
                className={styles.promptBox}
                placeholder="What sayeth?"
                value={characterPrompt}
                onChange={(e) => {
                  setCharacterPrompt(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default form submission or newline
                    handleCharacterPromptSubmit();
                  }
                }}
              />
              {/* Display characterEgo as text below the input */}
              <p className={styles.characterEgoDisplay}>{characterEgo}</p>
            </>
          )}

        {/* Character Input */}
        <p>
          {characterPrompt && (
            <ContentButton
              text="Send"
              onClick={handleCharacterPromptSubmit}
            />
          )}
        </p>

        {/* Character Output */}
        {characterResponseText && <p>{characterResponseText}</p>}

        {/* Progress Bar */}
          <br />
          <br />
          {currentTask && (
            <div className={styles.progressBarContainer}>
              {percentComplete < 1 ? (
                <>
                  {currentTask} {(percentComplete * 100).toFixed(1)}%
                  <WaitingEllipsis />
                  <ProgressBar percentComplete={percentComplete} />
                  {estimateComplete}{" "}
                  {/* This will be the remaining time estimate during progress */}
                </>
              ) : (
                estimateComplete // This will be the completion message when percentComplete is 1
              )}
            </div>
          )}

      </div>

      <br />
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