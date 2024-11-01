const { spawn } = require("child_process");

console.log("Starting development server...");

const nodemon = spawn("nodemon", ["src/server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
});

nodemon.on("exit", (code) => {
  process.exit(code);
});

process.on("SIGINT", () => {
  process.exit();
});
