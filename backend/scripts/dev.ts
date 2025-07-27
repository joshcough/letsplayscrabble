import { spawn } from "child_process";
import type { ChildProcess } from "child_process";

console.log("Starting development server...");

const nodemon: ChildProcess = spawn(
  "nodemon",
  ["--exec", "ts-node -r tsconfig-paths/register", "src/server.ts"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
  },
);

nodemon.on("exit", (code: number | null) => {
  process.exit(code ?? 1);
});

process.on("SIGINT", () => {
  process.exit();
});
