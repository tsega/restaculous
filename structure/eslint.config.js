import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["docs/**"]
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.node
      },
      sourceType: "module"
    },
    rules: {
      "no-console": "off"
    }
  }
];
