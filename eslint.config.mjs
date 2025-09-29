// @ts-check
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.stylistic,
    eslintConfigPrettier,
    eslintPluginAstro.configs.recommended,
    {
        ignores: [
            "dist/",
            "node_modules/",
            ".astro/",
            "bun.lockb",
            "src/scripts/editor/language/parser.js",
            "src/scripts/editor/language/parser.terms.js",
        ],
    },
);
