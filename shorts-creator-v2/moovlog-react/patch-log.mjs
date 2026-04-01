import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('node_modules/rollup/dist/es/shared/node-entry.js', 'utf8');
s = s.replace(
  'console.error("[R] BEFORE-CREATEOUTPUT keys="+Object.keys(generated).length); const _co = createOutput(generated); console.error("[R] AFTER-CREATEOUTPUT chunks="+_co.output.length); return _co;',
  'console.error("[R-"+__intId+"] BEFORE-CREATEOUTPUT keys="+Object.keys(generated).length); const _co = createOutput(generated); console.error("[R-"+__intId+"] AFTER-CREATEOUTPUT chunks="+_co.output.length); return _co;'
);
writeFileSync('node_modules/rollup/dist/es/shared/node-entry.js', s, 'utf8');
console.log('done');
