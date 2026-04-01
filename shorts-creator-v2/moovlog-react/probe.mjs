import { readFileSync } from 'fs';
const s = readFileSync('node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js', 'utf8');

// Find where build.write is set or defaulted
let pos = 0;
let count = 0;
while (true) {
  const i = s.indexOf('write', pos);
  if (i === -1) break;
  const context = s.slice(i-30, i+50);
  if (context.includes('options.write') || context.includes('build.write') || context.includes("write:") || context.includes("'write'")) {
    const line = s.slice(0, i).split('\n').length;
    console.log(`Line ${line}: ${context.replace(/\n/g,' ')}`);
    count++;
    if (count > 30) break;
  }
  pos = i + 5;
}
