import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate version info
const version = {
  version: Date.now().toString(),
  buildTime: new Date().toISOString(),
  timestamp: Date.now()
};

// Write to public folder so it's served statically
const versionPath = path.join(__dirname, '..', 'public', 'version.json');
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

console.log('Version file generated:', version);