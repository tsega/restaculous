import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const packageInfo = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

export const VERSION = packageInfo.version;

export const HELP = `Rest-a-culous

Generate an opinionated Express and Mongoose REST API.

Usage:
  resta <settings-file>
  resta generate <settings-file>
  resta init [settings-file]
  resta --help
  resta --version

Commands:
  generate    Generate an API from a validated settings file
  init        Interactively create a settings file

Options:
  -h, --help       Show this help message
  -v, --version    Show the installed version

The original restaculous command remains available as an alias.
`;

export class CliUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliUsageError";
  }
}

export function parseCliArguments(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" }
      },
      strict: true
    });
  } catch (error) {
    throw new CliUsageError(error.message, { cause: error });
  }

  if (parsed.values.help) {
    return { command: "help" };
  }
  if (parsed.values.version) {
    return { command: "version" };
  }

  const [command, argument, ...extra] = parsed.positionals;
  if (!command) {
    return { command: "help" };
  }
  if (extra.length > 0) {
    throw new CliUsageError(`Unexpected arguments: ${extra.join(" ")}`);
  }

  if (command === "generate") {
    if (!argument) {
      throw new CliUsageError("The generate command requires a settings file.");
    }
    return { command, settingsPath: argument };
  }

  if (command === "init") {
    return { command, settingsPath: argument ?? "settings.json" };
  }

  if (argument) {
    throw new CliUsageError(`Unknown command: ${command}`);
  }

  return { command: "generate", settingsPath: command };
}
