import airbnbBase from "eslint-config-airbnb-base";
import prettier from "eslint-config-prettier";

/**
 * Minimal ESLint setup for Node (ESM) + browser scripts under /public.
 * If you want stricter rules later, add per-folder overrides.
 */
export default [
  // Base rules
  ...airbnbBase,
  prettier,
  {
    ignores: ["node_modules/**", "data/**", "var/**"],
    rules: {
      "no-console": "off",
      "import/extensions": "off",
      "import/no-extraneous-dependencies": "off",
    },
  },
];
