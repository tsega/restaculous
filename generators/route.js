import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pluralize from "pluralize";

import { ACTIONS } from "../config/index.js";

const generatorDirectory = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(generatorDirectory, "../templates/route.js.template");

export function generate(settings, callback) {
  generateRoutes(settings).then(() => callback(null), callback);
}

async function generateRoutes(settings) {
  const template = await fs.readFile(templatePath, "utf8");

  for (const model of settings.models) {
    const route = renderRoute(template, model);
    const outputPath = path.join(
      settings.directory,
      "src/routes",
      `${model.name.toLowerCase()}.js`
    );
    await fs.writeFile(outputPath, route, "utf8");
  }
}

function renderRoute(template, model) {
  const routes = model.routes ?? ACTIONS;
  const authentication = new Set(model.authentication ?? []);
  const name = model.name;
  const lowerName = name.toLowerCase();
  const pluralModelName = pluralize(name);
  const middleware = (action) => authentication.has(action) ? "checkAuthToken, " : "";

  let route = template
    .replaceAll("{{modelName}}", name)
    .replaceAll("{{modelNameToLower}}", lowerName);

  const definitions = {
    post: `router.post("/", ${middleware("post")}postValidator, validateRequest, ${name}.create${name});`,
    search: `router.get("/search", ${middleware("search")}${name}.search${pluralModelName});`,
    get: `router.get("/:${lowerName}Id", ${middleware("get")}getValidator, validateRequest, ${name}.get${name});`,
    put: `router.put("/:${lowerName}Id", ${middleware("put")}putValidator, validateRequest, ${name}.update${name});`,
    delete: `router.delete("/:${lowerName}Id", ${middleware("delete")}deleteValidator, validateRequest, ${name}.remove${name});`
  };

  for (const action of ACTIONS) {
    route = route.replace(`{{${action}Route}}`, routes.includes(action) ? definitions[action] : "");
  }

  route = route.replace(
    "{{checkAuthImportToken}}",
    routes.some((action) => authentication.has(action))
      ? 'import { checkAuthToken } from "../middleware/auth.js";'
      : ""
  );

  return route;
}
