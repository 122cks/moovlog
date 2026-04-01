import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('node_modules/rollup/dist/es/shared/node-entry.js', 'utf8');

const before = `    timeEnd('BUILD', 1);
    const result = {`;
const after = `    timeEnd('BUILD', 1);
    console.error("[RI] timeEnd BUILD done, building result");
    const result = {`;

if (!s.includes(before)) {
  console.error('ERROR: target not found!');
  process.exit(1);
}
s = s.replace(before, after);

// Also add log after return result
const before2 = `    if (inputOptions.perf)
        result.getTimings = getTimings;
    return result;
}`;
const after2 = `    if (inputOptions.perf)
        result.getTimings = getTimings;
    console.error("[RI] returning result");
    return result;
}`;
if (!s.includes(before2)) {
  console.error('ERROR: target2 not found!');
  console.error(s.indexOf('result.getTimings = getTimings'));
} else {
  s = s.replace(before2, after2);
}

writeFileSync('node_modules/rollup/dist/es/shared/node-entry.js', s, 'utf8');
console.log('patched rollupInternal');
