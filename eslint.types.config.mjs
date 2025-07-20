// @ts-check

import mainConfig from "./eslint.config.mjs";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";

export default tseslint.config(
    ...mainConfig,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    eslintPluginAstro.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
