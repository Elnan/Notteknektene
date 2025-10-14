// Production-safe logging utility
// Only logs in development mode to avoid console pollution in production

export const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },

  warn: (...args) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },

  debug: (...args) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },

  info: (...args) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
};

// Export individual functions for convenience
export const { log, warn, error, debug, info } = logger;
