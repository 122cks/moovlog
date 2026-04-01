import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js', 'utf8');

// Add log to bundleWorkerEntry
const before = `async function bundleWorkerEntry(config, id) {
  const input = cleanUrl(id);`;
const after = `async function bundleWorkerEntry(config, id) {
  console.error("[VITE] bundleWorkerEntry called with id="+id.slice(0,120));
  const input = cleanUrl(id);`;

if (!s.includes(before)) {
  console.error('ERROR: bundleWorkerEntry target not found!');
  process.exit(1);
}
s = s.replace(before, after);
writeFileSync('node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js', s, 'utf8');
console.log('patched bundleWorkerEntry');
