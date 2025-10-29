import React from "react";
import { createRoot } from "react-dom/client";

import "./utils/logConfig"; // Disable console.log in production to prevent OBS memory bloat
import App from "./App";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);

root.render(<App />);
