import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { ACTIONS } from "../config/index.js";
import {
  FIELD_TYPES,
  getValidationIssue,
  VALIDATION_RULES
} from "./field-validation.js";

const actionSchema = z.enum(ACTIONS);
const configEntrySchema = z.object({
  name: z.string().trim().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  comment: z.string().default("")
});
const validationArgumentSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
]);
const attributeSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(FIELD_TYPES),
  desc: z.string().default(""),
  example: z.union([z.string(), z.number(), z.boolean()]).default(""),
  validation: z.array(z.object({
    type: z.enum(Object.keys(VALIDATION_RULES)),
    message: z.string().default(""),
    args: z.array(validationArgumentSchema).default([])
  })).default([]),
  isPrivate: z.boolean().default(false),
  isAuto: z.boolean().default(false)
});
const relationSchema = z.object({
  name: z.string().trim().min(1),
  referenceType: z.enum(["single", "multiple"]).default("single")
});
const modelSchema = z.object({
  name: z.string().trim().min(1),
  routes: z.array(actionSchema).default([...ACTIONS]),
  authentication: z.array(actionSchema).default([]),
  attributes: z.array(attributeSchema).default([]),
  relations: z.array(relationSchema).default([])
});
const settingsSchema = z.object({
  name: z.string().trim().min(1),
  version: z.string().trim().min(1).default("0.0.1"),
  description: z.string().default(""),
  author: z.string().default(""),
  directory: z.string().trim().min(1),
  repository: z.object({
    type: z.string().default("git"),
    url: z.string().default("")
  }).default({}),
  documentation: z.object({
    serverUrl: z.string().trim().min(1).default("/"),
    accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).default("#00dc82")
  }).default({ serverUrl: "/", accentColor: "#00dc82" }),
  authentication: z.boolean().default(false),
  config: z.array(configEntrySchema).optional(),
  models: z.array(modelSchema).default([])
}).superRefine((settings, context) => {
  settings.models.forEach((model, index) => {
    model.attributes.forEach((attribute, attributeIndex) => {
      attribute.validation.forEach((validation, validationIndex) => {
        const issue = getValidationIssue(attribute.type, validation);
        if (issue) {
          context.addIssue({
            code: "custom",
            message: issue,
            path: [
              "models",
              index,
              "attributes",
              attributeIndex,
              "validation",
              validationIndex
            ]
          });
        }
      });
    });
    model.authentication.forEach((action) => {
      if (!model.routes.includes(action)) {
        context.addIssue({
          code: "custom",
          message: `cannot require authentication for disabled route "${action}"`,
          path: ["models", index, "authentication"]
        });
      }
    });
    if (!settings.authentication && model.authentication.length > 0) {
      context.addIssue({
        code: "custom",
        message: "requires top-level authentication to be enabled",
        path: ["models", index, "authentication"]
      });
    }
  });
}).transform((settings) => ({
  ...settings,
  config: mergeConfig(defaultConfig(settings.name), settings.config ?? [])
}));

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

  return validateSettings(settings);
}

export function validateSettings(settings) {
  const result = settingsSchema.safeParse(settings);
  if (!result.success) {
    const details = result.error.issues.map(formatIssue).join("; ");
    throw new SettingsError(`Invalid settings: ${details}.`, {
      cause: result.error
    });
  }
  return result.data;
}

function formatIssue(issue) {
  const field = issue.path.length ? issue.path.join(".") : "settings";
  return `"${field}" ${issue.message.toLowerCase()}`;
}

function defaultConfig(name) {
  const databaseName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  return [
    { name: "HTTP_PORT", value: 8000, comment: "HTTP port" },
    {
      name: "MONGODB_URL",
      value: `mongodb://127.0.0.1:27017/${databaseName}`,
      comment: "MongoDB connection URL"
    },
    {
      name: "TEST_MONGODB_URL",
      value: `mongodb://127.0.0.1:27017/${databaseName}-test`,
      comment: "MongoDB connection URL used only by tests"
    },
    { name: "SALT_LENGTH", value: 12, comment: "Password hash rounds" },
    { name: "JWT_KEY", value: "change-me", comment: "JWT signing secret" },
    { name: "MAX_PAGE_SIZE", value: 100, comment: "Maximum search page size" },
    { name: "DEFAULT_SORT", value: "-updatedAt", comment: "Default sort" }
  ];
}

function mergeConfig(defaults, overrides) {
  const values = new Map(defaults.map((entry) => [entry.name, entry]));
  overrides.forEach((entry) => values.set(entry.name, entry));
  return [...values.values()];
}
