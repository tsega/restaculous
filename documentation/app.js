const methodOrder = ["get", "post", "put", "delete", "patch"];
const state = { entries: [] };

start().catch((error) => {
  document.querySelector("#api-description").textContent = `Unable to load documentation: ${error.message}`;
});

async function start() {
  const response = await fetch("/docs/openapi.json");
  if (!response.ok) throw new Error(`OpenAPI request failed with ${response.status}`);
  const spec = await response.json();
  document.documentElement.style.setProperty("--accent", spec["x-docs"]?.accentColor || "#00dc82");
  document.title = `${spec.info.title} · API documentation`;
  text("#brand-name", spec.info.title);
  text("#api-title", spec.info.title);
  text("#api-description", spec.info.description || "REST API reference");
  const repository = /^https?:\/\//.test(spec["x-docs"]?.repository || "") ? spec["x-docs"].repository : "";
  document.querySelector("#metadata").innerHTML = `<div class="meta"><span>Version ${escapeHtml(spec.info.version)}</span><span>Server ${escapeHtml(spec.servers?.[0]?.url || "/")}</span>${repository ? `<a href="${escapeAttribute(repository)}">Repository</a>` : ""}</div>`;
  state.entries = collectOperations(spec);
  renderNavigation(state.entries);
  renderEndpoints(state.entries, spec);
  setupTheme();
  setupSearch();
  setupCopyButtons();
  setupActiveSections();
}

function collectOperations(spec) {
  return Object.entries(spec.paths).flatMap(([path, pathItem]) => methodOrder.flatMap((method) => {
    const operation = pathItem[method];
    return operation ? [{ path, method, operation, id: slug(`${method}-${path}`), tag: operation.tags?.[0] || "Other" }] : [];
  }));
}

function renderNavigation(entries) {
  const groups = groupByTag(entries);
  const html = [`<a href="#introduction">Introduction</a>`];
  for (const [tag, operations] of groups) {
    html.push(`<strong>${escapeHtml(tag)}</strong>`, ...operations.map(({ id, method, operation }) => `<a href="#${id}"><span class="nav-method method-${method}">${method.toUpperCase()}</span>${escapeHtml(operation.summary)}</a>`));
  }
  document.querySelector("#endpoint-nav").innerHTML = html.join("");
}

function renderEndpoints(entries, spec) {
  const groups = groupByTag(entries);
  document.querySelector("#endpoints").innerHTML = [...groups].map(([tag, operations]) => `<section aria-labelledby="tag-${slug(tag)}"><h2 class="tag-heading" id="tag-${slug(tag)}">${escapeHtml(tag)}</h2>${operations.map((entry) => endpointHtml(entry, spec)).join("")}</section>`).join("");
  document.querySelector("#toc-nav").innerHTML = [`<a href="#introduction">Introduction</a>`, ...entries.map(({ id, operation }) => `<a href="#${id}">${escapeHtml(operation.summary)}</a>`)].join("");
}

function endpointHtml({ id, method, path, operation }, spec) {
  const parameters = (operation.parameters || []).map((parameter) => `<tr><td><code>${escapeHtml(parameter.name)}</code></td><td>${escapeHtml(parameter.in)}</td><td>${parameter.required ? "Required" : "Optional"}</td><td>${escapeHtml(parameter.description || parameter.schema?.type || "")}</td></tr>`).join("");
  const requestSchema = operation.requestBody?.content?.["application/json"]?.schema;
  const responses = Object.entries(operation.responses || {}).map(([status, response]) => { const schema = resolveSchema(response, spec); return `<h3>${escapeHtml(status)} · ${escapeHtml(resolveRef(response, spec).description || "Response")}</h3>${codeBlock(JSON.stringify(schema, null, 2), "Copy response schema")}${codeBlock(JSON.stringify(exampleValue(schema, spec), null, 2), "Copy response example")}`; }).join("");
  return `<details class="endpoint" id="${id}" open><summary><span class="method method-${method}">${method.toUpperCase()}</span><span class="path">${escapeHtml(path)}</span><span class="auth">${operation.security ? "JWT required" : "Public"}</span></summary><div class="endpoint-body"><p>${escapeHtml(operation.description || operation.summary)}</p><button class="copy" data-copy="${escapeAttribute(path)}">Copy path</button>${parameters ? `<h3>Parameters</h3><table class="parameters"><thead><tr><th>Name</th><th>Location</th><th>Required</th><th>Details</th></tr></thead><tbody>${parameters}</tbody></table>` : ""}${requestSchema ? `<h3>Request body</h3>${schemaHtml(resolveSchemaObject(requestSchema, spec))}${codeBlock(JSON.stringify(exampleValue(requestSchema, spec), null, 2), "Copy request")}` : ""}<h3>Responses</h3>${responses}</div></details>`;
}

function schemaHtml(schema) { const properties = schema?.properties || {}; return `<table class="schema"><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody>${Object.entries(properties).map(([name, value]) => `<tr><td><code>${escapeHtml(name)}</code>${schema.required?.includes(name) ? " *" : ""}</td><td>${escapeHtml(value.type || value.$ref?.split("/").pop() || "object")}</td><td>${escapeHtml(value.description || value.format || "")}</td></tr>`).join("")}</tbody></table>`; }
function resolveRef(value, spec) { if (!value?.$ref) return value || {}; return value.$ref.split("/").slice(1).reduce((result, key) => result?.[key], spec) || {}; }
function resolveSchema(response, spec) { const resolved = resolveRef(response, spec); return resolveSchemaObject(resolved.content?.["application/json"]?.schema || {}, spec); }
function resolveSchemaObject(schema, spec) { return schema?.$ref ? resolveRef(schema, spec) : schema || {}; }
function exampleValue(schema, spec) { const resolved = resolveSchemaObject(schema, spec); if (resolved.example !== undefined) return resolved.example; if (resolved.type === "array") return [exampleValue(resolved.items || {}, spec)]; if (resolved.type === "object" || resolved.properties) return Object.fromEntries(Object.entries(resolved.properties || {}).map(([name, value]) => [name, exampleValue(value, spec)])); return sample(resolved); }
function sample(schema) { if (schema.type === "array") return []; if (schema.type === "boolean") return true; if (["number", "integer"].includes(schema.type)) return 0; return schema.format === "date-time" ? "2026-01-01T00:00:00Z" : "string"; }
function codeBlock(value, label) { return `<button class="copy" data-copy="${escapeAttribute(value)}">${label}</button><pre><code>${escapeHtml(value)}</code></pre>`; }
function groupByTag(entries) { const groups = new Map(); entries.forEach((entry) => { if (!groups.has(entry.tag)) groups.set(entry.tag, []); groups.get(entry.tag).push(entry); }); return groups; }

function setupTheme() { const stored = localStorage.getItem("docs-theme"); const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; setTheme(stored || preferred); document.querySelector("#theme-button").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true)); }
function setTheme(theme, persist = false) { document.documentElement.dataset.theme = theme; document.querySelector("#theme-button").textContent = theme === "dark" ? "Light theme" : "Dark theme"; if (persist) localStorage.setItem("docs-theme", theme); }
function setupSearch() { const dialog = document.querySelector("#search-dialog"); const input = document.querySelector("#search-input"); const open = () => { if (!dialog.open) dialog.showModal(); input.focus(); renderSearch(""); }; document.querySelector("#search-button").addEventListener("click", open); document.querySelector("#search-close").addEventListener("click", () => dialog.close()); document.addEventListener("keydown", (event) => { if ((event.key === "/" && !isTyping(event.target)) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) { event.preventDefault(); open(); } if (event.key === "Escape" && dialog.open) dialog.close(); }); input.addEventListener("input", () => renderSearch(input.value)); input.addEventListener("keydown", (event) => { if (event.key === "ArrowDown") { event.preventDefault(); document.querySelector("[data-result]")?.focus(); } }); document.querySelector("#search-results").addEventListener("keydown", (event) => { if (!["ArrowDown", "ArrowUp"].includes(event.key)) return; event.preventDefault(); const results = [...document.querySelectorAll("[data-result]")]; const index = results.indexOf(document.activeElement); results[(index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length]?.focus(); }); }
function renderSearch(query) { const normalized = query.toLowerCase(); const results = state.entries.filter(({ path, operation, tag }) => `${path} ${operation.summary} ${tag}`.toLowerCase().includes(normalized)).slice(0, 12); document.querySelector("#search-results").innerHTML = results.map(({ id, method, path, operation }) => `<li><a href="#${id}" data-result><strong class="method-${method}">${method.toUpperCase()}</strong> ${escapeHtml(operation.summary)} <small>${escapeHtml(path)}</small></a></li>`).join("") || "<li>No results</li>"; text("#search-status", `${results.length} search results`); document.querySelectorAll("[data-result]").forEach((link) => link.addEventListener("click", () => document.querySelector("#search-dialog").close())); }
function setupCopyButtons() { document.addEventListener("click", async (event) => { const button = event.target.closest("[data-copy]"); if (!button) return; await navigator.clipboard.writeText(button.dataset.copy); const original = button.textContent; button.textContent = "Copied"; setTimeout(() => { button.textContent = original; }, 1200); }); }
function setupActiveSections() { const links = [...document.querySelectorAll(".sidebar a, .toc a")]; const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { links.forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`)); } }), { rootMargin: "-20% 0px -65%" }); document.querySelectorAll("main [id]").forEach((section) => observer.observe(section)); }
function isTyping(target) { return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable; }
function text(selector, value) { document.querySelector(selector).textContent = value; }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); }
function escapeAttribute(value) { return escapeHtml(value); }
