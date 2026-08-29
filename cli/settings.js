import { readFile } from "node:fs/promises";
import path from "node:path";

import { ACTIONS } from "../config/index.js";

export class SettingsError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "SettingsError";
  }
}

export function resolveSettingsPath(filePath, cwd = process.cwd()) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
}

export async function loadSettings(filePath, cwd = process.cwd()) {
  const settingsPath = resolveSettingsPath(filePath, cwd);
  let contents;

  try {
    contents = await readFile(settingsPath, "utf8");
  } catch (error) {
    throw new SettingsError(
      `Unable to read settings file "${settingsPath}": ${error.message}`,
      { cause: error }
    );
  }

  let settings;

  try {
    settings = JSON.parse(contents);
  } catch (error) {
    throw new SettingsError(
      `Invalid JSON in settings file "${settingsPath}": ${error.message}`,
      { cause: error }
    );
  }

  validateSettings(settings);
  return settings;
}

export function validateSettings(settings) {
  const errors = [];

  if (!isObject(settings)) {
    throw new SettingsError("Invalid settings: expected a JSON object.");
  }

  requireNonEmptyString(settings.name, "name", errors);
  requireNonEmptyString(settings.directory, "directory", errors);

  if (!isObject(settings.repository)) {
    errors.push('"repository" must be an object');
  }

  if (!Array.isArray(settings.config)) {
    errors.push('"config" must be an array');
  } else {
    settings.config.forEach((entry, index) => {
      if (!isObject(entry)) {
        errors.push(`"config[${index}]" must be an object`);
        return;
      }

      requireNonEmptyString(entry.name, `config[${index}].name`, errors);
      if (!("value" in entry)) {
        errors.push(`"config[${index}].value" is required`);
      }
    });
  }

  if (settings.authentication !== undefined && typeof settings.authentication !== "boolean") {
    errors.push('"authentication" must be a boolean when provided');
  }

  if (!Array.isArray(settings.models)) {
    errors.push('"models" must be an array');
  } else {
    settings.models.forEach((model, index) => validateModel(model, index, errors));
  }

  if (errors.length > 0) {
    throw new SettingsError(`Invalid settings: ${errors.join("; ")}.`);
  }

  return settings;
}

function validateModel(model, index, errors) {
  const prefix = `models[${index}]`;

  if (!isObject(model)) {
    errors.push(`"${prefix}" must be an object`);
    return;
  }

  requireNonEmptyString(model.name, `${prefix}.name`, errors);

  if (!Array.isArray(model.attributes)) {
    errors.push(`"${prefix}.attributes" must be an array`);
  } else {
    model.attributes.forEach((attribute, attributeIndex) => {
      const attributePrefix = `${prefix}.attributes[${attributeIndex}]`;
      if (!isObject(attribute)) {
        errors.push(`"${attributePrefix}" must be an object`);
        return;
      }

      requireNonEmptyString(attribute.name, `${attributePrefix}.name`, errors);
      requireNonEmptyString(attribute.type, `${attributePrefix}.type`, errors);
    });
  }

  if (model.authentication !== undefined) {
    if (!Array.isArray(model.authentication)) {
      errors.push(`"${prefix}.authentication" must be an array`);
    } else {
      const invalidActions = model.authentication.filter(
        (action) => !ACTIONS.includes(action)
      );
      if (invalidActions.length > 0) {
        errors.push(
          `"${prefix}.authentication" contains unsupported actions: ${invalidActions.join(", ")}`
        );
      }
    }
  }
}

function requireNonEmptyString(value, field, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`"${field}" must be a non-empty string`);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
