import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import { lezer } from "@lezer/generator/rollup";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), lezer()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: "./vite.config.ts",
				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.{test,spec}.{js,ts}"],
					exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
				},
			},
		],
	},
	optimizeDeps: {
		exclude: [
			"assimpts", // Vite does not like dynamic imports after optimization
		],
	},
});
