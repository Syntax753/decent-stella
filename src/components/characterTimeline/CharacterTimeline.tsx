import React from 'react';
import styles from './CharacterTimeline.module.css';

interface CharacterTimelineProps {
  characterTimeline: Set<string>[];
  eventTimeline: string[];
  onCharacterClick: (character: string) => void;
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

const CharacterTimeline: React.FC<CharacterTimelineProps> = ({ characterTimeline, eventTimeline, onCharacterClick }) => {
  if (!characterTimeline || characterTimeline.length === 0) {
    return null;
  }

  const numChunks = characterTimeline.length;
  const eventGroups = groupConsecutiveEvents(eventTimeline);

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline}>
        {characterTimeline.map((chunkCharacters, index) => {
          const timelineStartColor = { r: 197, g: 116, b: 49 }; // #c57431
          const timelineEndColor = { r: 85, g: 85, b: 85 };   // #555

          let chunkBg;

          if (numChunks === 1) {
            chunkBg = `rgb(${timelineStartColor.r}, ${timelineStartColor.g}, ${timelineStartColor.b})`;
          } else {
            const t_start = index / (numChunks - 1);
            const r_start = Math.round(timelineStartColor.r + (timelineEndColor.r - timelineStartColor.r) * t_start);
            const g_start = Math.round(timelineStartColor.g + (timelineEndColor.g - timelineStartColor.g) * t_start);
            const b_start = Math.round(timelineStartColor.b + (timelineEndColor.b - timelineStartColor.b) * t_start);

            const t_end = (index + 1) / (numChunks - 1);
            const r_end = Math.round(timelineStartColor.r + (timelineEndColor.r - timelineStartColor.r) * t_end);
            const g_end = Math.round(timelineStartColor.g + (timelineEndColor.g - timelineStartColor.g) * t_end);
            const b_end = Math.round(timelineStartColor.b + (timelineEndColor.b - timelineStartColor.b) * t_end);

            chunkBg = `linear-gradient(to right, rgb(${r_start}, ${g_start}, ${b_start}), rgb(${r_end}, ${g_end}, ${b_end}))`;
          }

          const chunkStyle = {
            background: chunkBg,
            '--chunk-text-color': '#e0e0e0',
            '--character-bg-color': 'rgba(0, 0, 0, 0.4)',
          } as React.CSSProperties;

          return (
            <div key={index} className={styles.chunk} style={chunkStyle}>
              <div className={styles.characterList}>
                {Array.from(chunkCharacters).sort().map(character => (
                  <div key={character} className={styles.character} title={character} onClick={() => onCharacterClick(character)}>
                    {character}
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