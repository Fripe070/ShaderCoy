// @ts-check
import objImportPlugin from "./scripts/generated-assets-plugin.ts";
import { lezer } from "@lezer/generator/rollup";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
    devToolbar: { enabled: false },
    integrations: [icon()],

    vite: {
        // @ts-expect-error For some reason it doesn't like the types?
        plugins: [tailwindcss(), { ...lezer(), enforce: "pre" }, objImportPlugin()],
        optimizeDeps: {
            exclude: ["assimpts"], // Otherwise WASM file is available in dev
        },
    },

    experimental: {
        fonts: [
            {
                provider: fontProviders.google(),
                name: "Cascadia Code",
                cssVariable: "--font-cascadia",
            },
        ],
    },
});
