export function createLogger({ verbose = false, write = console.error } = {}) {
  return {
    debug(message) {
      if (verbose) {
        write(`[verbose] ${message}`);
      }
    },

    reportError(error) {
      if (!verbose) {
        return;
      }

      write("[verbose] Error details:");
      write(formatErrorDetails(error));
    }
  };
}

export function formatErrorDetails(error) {
  const details = [];
  const seen = new Set();
  let current = error;

  while (current && !seen.has(current)) {
    seen.add(current);
    details.push(current.stack ?? String(current));
    current = current.cause;
    if (current && !seen.has(current)) {
      details.push("Caused by:");
    }
  }

  return details.join("\n");
}
