import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('node_modules/rollup/dist/es/shared/node-entry.js', 'utf8');

// Replace console.error with synchronous writeSync
s = s.replace(/console\.error\(\[RI\]/g, 'process.stderr.write("[RI]"+');

// Actually let's do it properly - replace all [RI] related console.error
// First check what's in there
const lines = s.split('\n');
const found = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('[RI]')) {
    found.push(`Line ${i+1}: ${lines[i].trim()}`);
  }
}
console.log('Found [RI] logs:');
found.forEach(l => console.log(l));
