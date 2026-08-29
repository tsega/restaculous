import { execFile } from "node:child_process";

const DEFAULT_MAX_BUFFER = 1024 * 1024 * 10;

export function runCommand(executable, args, { cwd }, callback) {
  const options = {
    cwd,
    encoding: "utf8",
    maxBuffer: DEFAULT_MAX_BUFFER
  };

  execFile(executable, args, options, (error, stdout, stderr) => {
    if (!error) {
      callback(null, { stdout, stderr });
      return;
    }

    const command = [executable, ...args].join(" ");
    const reason = stderr.trim() || error.message;
    const contextualError = new Error(
      `Command "${command}" failed in "${cwd}": ${reason}`,
      { cause: error }
    );
    contextualError.command = command;
    contextualError.cwd = cwd;
    contextualError.stdout = stdout;
    contextualError.stderr = stderr;
    callback(contextualError);
  });
}
