import { defineConfig, globalIgnores } from "eslint/config";

import js from "@eslint/js";
import globals from "globals";

import tseslint from "typescript-eslint";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
  ]),
  ...nextVitals,
  ...nextTs,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      /* React Hooks rules */
      ...reactHooks.configs.recommended.rules,

      /* React Fast Refresh (Vite / Next dev UX) */
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      /* TypeScript adjustments (matches your tsconfig intent) */
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      /* Safety & consistency */
      "no-console": "off",
      "no-debugger": "warn",
    },
  },
]);
