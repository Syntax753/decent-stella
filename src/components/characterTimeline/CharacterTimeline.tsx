import React from 'react';
import styles from './CharacterTimeline.module.css';

interface CharacterTimelineProps {
  characterTimeline: Set<string>[];
  eventTimeline: string[];
}

function groupConsecutiveEvents(eventTimeline: string[]) {
  const groups: { name: string; span: number }[] = [];
  if (!eventTimeline || eventTimeline.length === 0) {
    return groups;
  }

  let i = 0;
  while (i < eventTimeline.length) {
    const currentEvent = eventTimeline[i];
    let span = 1;
    while (i + span < eventTimeline.length && eventTimeline[i + span] === currentEvent) {
      span++;
    }
    groups.push({ name: currentEvent, span });
    i += span;
  }
  return groups;
}

const CharacterTimeline: React.FC<CharacterTimelineProps> = ({ characterTimeline, eventTimeline }) => {
  if (!characterTimeline || characterTimeline.length === 0) {
    return null;
  }

  const numChunks = characterTimeline.length;
  const eventGroups = groupConsecutiveEvents(eventTimeline);

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
      {eventGroups.length > 0 && (
        <div className={styles.eventTimeline}>
          {eventGroups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={styles.eventGroup}
              style={{ flex: `${group.span} 0 0` }}
            >
              {group.name !== 'NONE' && (
                <div className={styles.eventBraceContainer}>
                  <div className={styles.eventBrace} />
                  <div className={styles.eventName}>{group.name}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterTimeline;