// import { Environment } from "@mlc-ai/web-runtime/lib/environment";

interface CharacterEgo {
  name: string;
  ego: string;
}

interface Event {
  event: string;
  character: string;
}

export function formatMapToString(map: Map<string, string>): string {
  const outputLines: string[] = [];

  // Iterate through the Map entries (key-value pairs)
  map.forEach((egos, name) => {
    // Format each entry as "Name: Egos"
    outputLines.push(`[${name} => ${egos}]`);
  });

  // Join all the formatted lines with a newline character
  return outputLines.join(' ');
}

export function mergeEventsFromJSONStrings(
  jsonString: string,
  eventMap: Map<string, Set<string>>
): Map<string, Set<string>> {

  // jsonStringArray.forEach((jsonString, index) => {
  try {
    // Parse the string into an array of objects
    // We assert the type here after parsing. Be sure the input format matches.

    console.log("Event json in", jsonString);

    const events: Event[] = JSON.parse(jsonString.trim());

    console.log("Events in", events);

    // // Check if the parsed result is actually an array (robustness)
    // if (!Array.isArray(events)) {
    //   console.warn(`Parsed data from string index ${index} is not an array, skipping.`, jsonString);
    //   return; // Skip this string
    // }

    // Iterate through each character object in the parsed array
    events.forEach((event) => {
      // Basic validation of the object structure
      if (event && typeof event.event === 'string' && typeof event.character === 'string') {
        const eventName = event.event.trim();
        const character = event.character.trim();

        if (!eventName || !character) {
          // Skip if the ego string is empty after trimming
          return;
        }

        if (eventName.toUpperCase() == 'NONE') {
          // console.log("Skipping empty ego", character);
          return;
        }

        // Check if the name already exists in the map
        const existingCharacter = eventMap.get(character);

        if (existingCharacter !== undefined) {
          // Name exists: append the new ego with the separator
          eventMap.set(character, existingCharacter.add(eventName));
        } else {
          // Name doesn't exist: add it with the current ego
          eventMap.set(character, new Set<string>().add(eventName));
        }
      } else {
        console.warn(`Skipping invalid object format`, event);
      }
    });

  } catch (error) {
    console.error(`Failed to parse JSON`, jsonString);
    // Optional: Decide if you want to stop processing or just skip the invalid string
  }
  // });

  return eventMap;
}

export function mergeEgosFromJSONStrings(
  jsonString: string,
  egoMap: Map<string, string>,
  separator: string = ". ", // Default separator,
): Map<string, string> {

  // jsonStringArray.forEach((jsonString, index) => {
  try {
    console.log("Character json in", jsonString);

    // Parse the string into an array of objects
    // We assert the type here after parsing. Be sure the input format matches.
    const characters: CharacterEgo[] = JSON.parse(jsonString.trim());

    console.log("Characters in", characters);

    // // Check if the parsed result is actually an array (robustness)
    // if (!Array.isArray(characters)) {
    //   console.warn(`Parsed data from string {jsonString} is not an array, skipping.`);
    //   throw Error();
    // }

    // Iterate through each character object in the parsed array
    characters.forEach((character) => {
      // Basic validation of the object structure
      if (character && typeof character.name === 'string' && typeof character.ego === 'string') {
        const name = character.name;
        const currentEgo = character.ego.trim(); // Trim whitespace

        if (!currentEgo) {
          // Skip if the ego string is empty after trimming
          return;
        }

        if (currentEgo.toUpperCase() == 'NONE') {
          // console.log("Skipping empty ego", character);
          return;
        }

        // Check if the name already exists in the map
        const existingEgos = egoMap.get(name);

        if (existingEgos !== undefined) {
          // Name exists: append the new ego with the separator
          egoMap.set(name, existingEgos + separator + currentEgo);
        } else {
          // Name doesn't exist: add it with the current ego
          egoMap.set(name, currentEgo);
        }
      } else {
        console.warn(`Skipping invalid object format`, character);
      }
    });

  } catch (error) {
    console.error(`Failed to parse JSON`, jsonString);
    // Optional: Decide if you want to stop processing or just skip the invalid string
  }
  // });

  return egoMap;
}