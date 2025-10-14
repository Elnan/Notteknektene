import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Debug utilities removed to clean up console output

// Load global clear functions for easy access (development only)
if (import.meta.env.DEV) {
  import("./utils/globalClearFunctions.js");
}

// Initialize round table manager for automatic deadline checking
const initializeApp = async () => {
  try {
    const { initializeRoundTableManager } = await import(
      "./utils/roundTableManager.js"
    );
    const cleanup = initializeRoundTableManager();

    // Store cleanup function for potential use
    window.cleanupRoundTableManager = cleanup;

    if (import.meta.env.DEV) {
      console.log("✅ Round Table Manager initialized");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Round Table Manager:", error);
  }
};

// Initialize the round table manager
initializeApp();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
