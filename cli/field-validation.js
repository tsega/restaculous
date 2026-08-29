export const FIELD_TYPES = ["String", "Number", "Boolean", "Date"];

export const VALIDATION_RULES = {
  notEmpty: { fieldTypes: FIELD_TYPES, arguments: "none" },
  isString: { fieldTypes: ["String"], arguments: "none" },
  isEmail: { fieldTypes: ["String"], arguments: "none" },
  isURL: { fieldTypes: ["String"], arguments: "none" },
  isLength: {
    fieldTypes: ["String"],
    arguments: "range-required",
    wholeNumbers: true
  },
  isNumeric: { fieldTypes: ["Number"], arguments: "none" },
  isInt: { fieldTypes: ["Number"], arguments: "range-optional" },
  isFloat: { fieldTypes: ["Number"], arguments: "range-optional" },
  isBoolean: { fieldTypes: ["Boolean"], arguments: "none" },
  isISO8601: { fieldTypes: ["Date"], arguments: "none" }
};

export function getValidationIssue(fieldType, validation) {
  const rule = VALIDATION_RULES[validation.type];
  if (!rule) {
    return `unsupported validation rule "${validation.type}"`;
  }
  if (!rule.fieldTypes.includes(fieldType)) {
    return `validation rule "${validation.type}" is incompatible with field type "${fieldType}"`;
  }

  const args = validation.args;
  if (rule.arguments === "none" && args.length > 0) {
    return `validation rule "${validation.type}" does not accept arguments`;
  }
  if (rule.arguments === "range-required" && args.length !== 1) {
    return `validation rule "${validation.type}" requires one range argument`;
  }
  if (rule.arguments === "range-optional" && args.length > 1) {
    return `validation rule "${validation.type}" accepts at most one range argument`;
  }
  if (args.length === 1 && rule.arguments.startsWith("range")) {
    return getRangeIssue(args[0], rule.wholeNumbers);
  }

  return null;
}

export function getInvalidValidationValue(validation) {
  if (validation.type === "isBoolean") {
    return "not-a-boolean";
  }
  if (["isNumeric", "isFloat"].includes(validation.type)) {
    return "not-a-number";
  }
  if (validation.type === "isInt") {
    return 1.5;
  }
  if (validation.type === "isISO8601") {
    return "not-a-date";
  }
  if (validation.type === "isString") {
    return 123;
  }
  if (validation.type === "isEmail") {
    return "not-an-email";
  }
  if (validation.type === "isURL") {
    return "not-a-url";
  }
  if (validation.type === "isLength") {
    const { min, max } = validation.args[0];
    return min > 0 ? "" : "x".repeat(max + 1);
  }
  return "";
}

function getRangeIssue(value, wholeNumbers = false) {
  if (!isPlainObject(value)) {
    return "range argument must be an object containing min or max";
  }

  const keys = Object.keys(value);
  if (keys.length === 0 || keys.some((key) => !["min", "max"].includes(key))) {
    return "range argument must contain only min or max";
  }
  if (keys.some((key) => typeof value[key] !== "number")) {
    return "range argument min and max values must be numbers";
  }
  if (wholeNumbers && keys.some((key) => !Number.isInteger(value[key]) || value[key] < 0)) {
    return "range argument min and max values must be non-negative integers";
  }
  if (value.min != null && value.max != null && value.min > value.max) {
    return "range argument min cannot be greater than max";
  }
  if (wholeNumbers && value.max == null && value.min === 0) {
    return "length range must define max or a positive min";
  }
  return null;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
