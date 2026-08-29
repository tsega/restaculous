function write(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const details = formatContext(context);
  const output = `${timestamp} ${level.toUpperCase()} ${message}${details}`;

  if (level === "error") {
    console.error(output);
    return;
  }
  if (level === "warn") {
    console.warn(output);
    return;
  }
  console.log(output);
}

function formatContext(context) {
  const entries = Object.entries(context).filter(([, value]) => value != null);
  if (entries.length === 0) {
    return "";
  }

  return ` ${entries.map(([key, value]) => `${key}=${formatValue(value)}`).join(" ")}`;
}

function formatValue(value) {
  if (value instanceof Error) {
    return JSON.stringify(value.stack ?? value.message);
  }
  return JSON.stringify(value);
}

export const logger = {
  info(message, context) {
    write("info", message, context);
  },
  warn(message, context) {
    write("warn", message, context);
  },
  error(message, context) {
    write("error", message, context);
  }
};
