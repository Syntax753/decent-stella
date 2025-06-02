
interface CharacterEgo {
  name: string;
  ego: string;
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

export function mergeEgosFromJSONStrings(
  jsonStringArray: string[],
  egoMap: Map<string, string>,
  separator: string = ". ", // Default separator,
): Map<string, string> {

  // const egoMap = new Map<string, string>();

  jsonStringArray.forEach((jsonString, index) => {
    try {
      // Parse the string into an array of objects
      // We assert the type here after parsing. Be sure the input format matches.
      const characters: CharacterEgo[] = JSON.parse(jsonString.trim());

      // Check if the parsed result is actually an array (robustness)
      if (!Array.isArray(characters)) {
        console.warn(`Parsed data from string index ${index} is not an array, skipping.`);
        return; // Skip this string
      }

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
          console.warn(`Skipping invalid object format within string index ${index}:`, character);
        }
      });

    } catch (error) {
      console.error(`Failed to parse JSON string at index ${index}:`, error);
      // Optional: Decide if you want to stop processing or just skip the invalid string
      console.error("Original string:", jsonString); // Uncomment to log the problematic string
    }
  });

  return egoMap;
}