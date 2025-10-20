import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Debug utilities removed to clean up console output

// Load global clear functions for easy access (development only)
if (import.meta.env.DEV) {
  import("./utils/globalClearFunctions.js");
  // Load test deadline utilities for testing automatic game updates
  import("./utils/testDeadlineUtils.js");
}

// Initialize round table manager for automatic deadline checking
// Only initialize after user authentication to avoid permission errors
const initializeApp = async () => {
  try {
    // Wait for authentication to be ready
    const { initializeRoundTableManager } = await import(
      "./utils/roundTableManager.js"
    );

    // Don't initialize immediately - let the auth context handle this
    // The round table manager will be initialized when needed
    if (import.meta.env.DEV) {
      console.log("✅ Round Table Manager ready for initialization");
    }
  } catch (error) {
    console.error("❌ Failed to prepare Round Table Manager:", error);
  }
};

// Don't initialize immediately - wait for authentication
// initializeApp();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
