import fs from 'fs';
import path from 'path';

/**
 * Safely load a JSON file.
 * @param {string} filePath - Path to the JSON file.
 * @param {any} fallback - Value to return if file is missing or invalid.
 * @returns {any} Parsed JSON or fallback.
 */
export function loadJsonSafe(filePath, fallback = {}) {
  try {
    const absolutePath = path.resolve(filePath); // ensure absolute path
    const jsonString = fs.readFileSync(absolutePath, 'utf-8');
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
// 
// // Usage example
// import { ZOOM_FILE } from '../util/path.js';

// const zf = loadJsonSafe(ZOOM_FILE, {}); // empty object fallback
// console.log('ZOOM file content:', zf);