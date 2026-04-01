import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js', 'utf8');

const before = `    bundle = await rollup(rollupOptions);
    if (options.write) {
      prepareOutDir(resolvedOutDirs, emptyOutDir, config);
    }
    const res = [];
    for (const output of normalizedOutputs) {
      res.push(await bundle[options.write ? "write" : "generate"](output));
    }`;

const after = `    bundle = await rollup(rollupOptions);
    console.error("[VITE] rollup() done, options.write="+options.write);
    if (options.write) {
      console.error("[VITE] prepareOutDir...");
      prepareOutDir(resolvedOutDirs, emptyOutDir, config);
      console.error("[VITE] prepareOutDir done");
    }
    const res = [];
    console.error("[VITE] starting bundle output, normalizedOutputs="+normalizedOutputs.length);
    for (const output of normalizedOutputs) {
      console.error("[VITE] bundle."+((options.write)?"write":"generate")+" called");
      res.push(await bundle[options.write ? "write" : "generate"](output));
      console.error("[VITE] bundle."+((options.write)?"write":"generate")+" done");
    }`;

if (!s.includes(before)) {
  console.error('ERROR: target not found!');
  process.exit(1);
}
s = s.replace(before, after);
writeFileSync('node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js', s, 'utf8');
console.log('patched dep-BK3b2jBa.js');
