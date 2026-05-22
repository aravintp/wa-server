import fsLegacy  from 'fs';
import path from 'path';
import fs from 'fs/promises';

/**
 * Safely load a JSON file.
 * @param {string} filePath - Path to the JSON file.
 * @param {any} fallback - Value to return if file is missing or invalid.
 * @returns {any} Parsed JSON or fallback.
 */
export function loadJsonSafe(filePath, fallback = {}) {
  try {
    const absolutePath = path.resolve(filePath); // ensure absolute path
    const jsonString = fsLegacy.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(jsonString);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`File not found: ${filePath}. Using fallback.`);
    } else {
      console.warn(`Error reading/parsing JSON file: ${filePath}. Using fallback.`, err.message);
    }
    return fallback;
  }
}

export function getunique(newlogs, oldlogs, key, key2) {
  return newlogs.filter(
    newLog =>
      !oldlogs.some(log => {
        const match = key2
          ? log[key] === newLog[key] &&
            log[key2] === newLog[key2]
          : log[key] === newLog[key];

        return match;
      })
  );
}

export async function loadWAAgents(path) {
    try {
        const data = await fs.readFile(path, 'utf8');

        // Split into rows
        const rows = data.trim().split(/\r?\n/);

        // Convert CSV rows into objects
        var wa_agents = rows.map(row => {
            const [name, number] = row.split(/,/);

            return {
                name: name.trim(),
                number: number.trim(),
            };
        });

        return wa_agents;

    } catch (err) {
        console.error(err);
    }
}

// 
// // Usage example
// import { ZOOM_FILE } from '../util/path.js';

// const zf = loadJsonSafe(ZOOM_FILE, {}); // empty object fallback
// console.log('ZOOM file content:', zf);