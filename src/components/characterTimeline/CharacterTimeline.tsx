import React from 'react';
import styles from './CharacterTimeline.module.css';

interface CharacterTimelineProps {
  characterTimeline: Set<string>[];
}

const CharacterTimeline: React.FC<CharacterTimelineProps> = ({ characterTimeline }) => {
  if (!characterTimeline || characterTimeline.length === 0) {
    return null;
  }

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline}>
        {characterTimeline.map((chunkCharacters, index) => (
          <div key={index} className={styles.chunk}>
            <div className={styles.characterList}>
              {Array.from(chunkCharacters).sort().map(character => (
                <div key={character} className={styles.character} title={character}>
                  {character.substring(0, 8) + (character.length > 8 ? '…' : '')}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterTimeline;