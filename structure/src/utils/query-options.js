import { DEFAULT_SORT, MAX_PAGE_SIZE } from "../config/index.js";
import { HttpError } from "./http-error.js";

export function getQueryOptions(query, defaultFields) {
  const requestedLimit = Number.parseInt(query.limit ?? MAX_PAGE_SIZE, 10);
  const limit = Math.min(Math.max(requestedLimit || MAX_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = Math.max(Number.parseInt(query.page ?? "1", 10) || 1, 1);

  return {
    filter: parseFilter(query.filter),
    fields: query.fields
      ? query.fields.split(",").join(" ")
      : defaultFields.join(" "),
    limit,
    page,
    sort: query.sort ?? DEFAULT_SORT
  };
}

function parseFilter(filter) {
  if (!filter) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(filter);
  } catch {
    throw new HttpError(400, "filter must be valid JSON");
  }
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new HttpError(400, "filter must be a JSON object");
  }
  return parsed;
}
