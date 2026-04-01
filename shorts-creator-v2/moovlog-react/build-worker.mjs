// build-child.mjs - Runs vite build in a child process with custom --stack-size
// build-child.mjs - Runs vite build in a child process with custom --stack-size
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// vite main entry point
const viteEntry = join(__dirname, "node_modules", "vite", "bin", "vite.js");

console.error("[BUILD] Spawning vite build with 65536KB v8 stack...");
const child = spawn(
  process.execPath,
  ["--stack-size=65536", viteEntry, "build"],
  {
    stdio: "inherit",
    cwd: __dirname,
    env: { ...process.env },
  }
);
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => { console.error(err); process.exit(1); });