import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timestamp = Date.now();

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write version to public/version.json (visible to clients)
fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify({ version: timestamp }, null, 2)
);

// Write version to src/version.js (compiled into the bundle)
fs.writeFileSync(
  path.join(__dirname, 'src', 'version.js'),
  `export const APP_VERSION = ${timestamp};\n`
);

console.log(`[Auto-Version] Generated new build version: ${timestamp}`);
