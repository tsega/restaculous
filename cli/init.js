import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";

import { ACTIONS } from "../config/index.js";
import { validateSettings } from "./settings.js";

export async function runInit({
  settingsPath = "settings.json",
  cwd = process.cwd(),
  input = process.stdin,
  output = process.stdout,
  ask
} = {}) {
  const prompts = ask ? null : createInterface({ input, output });
  const prompt = ask ?? ((question) => prompts.question(question));

  try {
    const targetPath = path.resolve(cwd, settingsPath);

    if (await fileExists(targetPath)) {
      const overwrite = await askBoolean(
        prompt,
        `Overwrite ${targetPath}?`,
        false
      );
      if (!overwrite) {
        return { created: false, path: targetPath };
      }
    }

    const settings = await createSettingsFromPrompts(prompt);
    await writeFile(targetPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
    return { created: true, path: targetPath };
  } finally {
    prompts?.close();
  }
}

export async function createSettingsFromPrompts(ask) {
  const name = await askRequired(ask, "Application name: ");
  const suggestedDirectory = `./${slugify(name)}`;
  const directory = await askWithDefault(ask, "Output directory", suggestedDirectory);
  const description = (await ask("Description (optional): ")).trim();
  const author = (await ask("Author (optional): ")).trim();
  const repositoryUrl = (await ask("Repository URL (optional): ")).trim();
  const authentication = await askBoolean(ask, "Enable JWT authentication?", false);
  const modelNames = parseList(await ask("Models, separated by commas (optional): "));
  const models = [];

  for (const modelName of modelNames) {
    const attributes = parseAttributes(
      await ask(`${modelName} attributes as name:type pairs (optional): `)
    );
    const routes = parseActions(
      await askWithDefault(ask, `${modelName} CRUD routes`, ACTIONS.join(","))
    );
    const protectedRoutes = authentication
      ? parseActions(await ask(`${modelName} protected routes (optional): `))
      : [];

    models.push({
      name: capitalize(modelName),
      attributes,
      routes,
      authentication: protectedRoutes
    });
  }

  const settings = {
    name,
    directory,
    ...(description && { description }),
    ...(author && { author }),
    ...(repositoryUrl && { repository: { type: "git", url: repositoryUrl } }),
    ...(authentication && { authentication }),
    ...(models.length && { models })
  };

  validateSettings(settings);
  return settings;
}

async function askRequired(ask, label) {
  while (true) {
    const answer = (await ask(label)).trim();
    if (answer) {
      return answer;
    }
  }
}

async function askWithDefault(ask, label, defaultValue) {
  const answer = (await ask(`${label} (${defaultValue}): `)).trim();
  return answer || defaultValue;
}

async function askBoolean(ask, label, defaultValue) {
  const hint = defaultValue ? "Y/n" : "y/N";
  const answer = (await ask(`${label} [${hint}] `)).trim().toLowerCase();
  if (!answer) {
    return defaultValue;
  }
  return answer === "y" || answer === "yes";
}

function parseList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseActions(value) {
  return [...new Set(parseList(value).map((action) => action.toLowerCase()))];
}

function parseAttributes(value) {
  return parseList(value).map((entry) => {
    const [name, type = "String"] = entry.split(":").map((part) => part.trim());
    return { name, type };
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
