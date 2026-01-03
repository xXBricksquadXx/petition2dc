import js from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

/**
 * ESLint 9 flat config.
 * - Node code: src/**, scripts/**
 * - Browser code: src/public/**
 */
export default [
  { ignores: ["node_modules/**", "data/**", "var/**"] },

  // ESLint recommended rules for JS
  js.configs.recommended,

  // import rules (optional but useful)
  {
    plugins: { import: importPlugin },
    rules: {
      "no-console": "off",
      "import/extensions": "off",
      "import/no-extraneous-dependencies": "off"
    }
  },

  // Node environment
  {
    files: ["src/**/*.js", "scripts/**/*.js", "scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node
    }
  },

  // Browser environment
  {
    files: ["src/public/**/*.js"],
    languageOptions: {
      globals: globals.browser
    }
  },

  // Disable ESLint rules that conflict with Prettier
  prettier
];
