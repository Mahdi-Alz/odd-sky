import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"] },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["apps/web/**/*.{js,vue}"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ["packages/core/**/*.js"],
    languageOptions: { globals: { ...globals.es2021 } },
  },
  {
    files: ["**/*.config.js", "**/*.test.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "vue/attributes-order": "off",
    },
  },
  prettier,
];
