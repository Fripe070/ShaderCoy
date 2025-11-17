// @ts-check
import mainConfig from "./eslint.config.js";
import ts from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
	ts.configs.recommendedTypeChecked,
	ts.configs.stylisticTypeChecked,
	{ languageOptions: { parserOptions: { projectService: true } } },
	...mainConfig,
);
