const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "jsx-a11y/alt-text": "off",
      "react/display-name": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
