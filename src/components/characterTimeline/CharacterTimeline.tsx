import React from 'react';
import styles from './CharacterTimeline.module.css';

interface CharacterTimelineProps {
  characterTimeline: Set<string>[];
}

const CharacterTimeline: React.FC<CharacterTimelineProps> = ({ characterTimeline }) => {
  if (!characterTimeline || characterTimeline.length === 0) {
    return null;
  }

  const numChunks = characterTimeline.length;

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline}>
        {characterTimeline.map((chunkCharacters, index) => {
          let backgroundColorValue = 0;
          if (numChunks > 1) {
            backgroundColorValue = Math.round((index / (numChunks - 1)) * 255);
          }

          const chunkStyle = {
            '--chunk-bg-color': `rgb(${backgroundColorValue}, ${backgroundColorValue}, ${backgroundColorValue})`,
            '--chunk-text-color': backgroundColorValue < 128 ? '#e0e0e0' : '#202020',
            '--character-bg-color': backgroundColorValue < 128 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
          } as React.CSSProperties;

          return (
            <div key={index} className={styles.chunk} style={chunkStyle}>
              <div className={styles.characterList}>
                {Array.from(chunkCharacters).sort().map(character => (
                  <div key={character} className={styles.character} title={character}>
                    {character.substring(0, 8) + (character.length > 8 ? '…' : '')}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterTimeline;