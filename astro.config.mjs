// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { lezer } from "@lezer/generator/rollup";

export default defineConfig({
    devToolbar: { enabled: false },
    integrations: [icon()],

    vite: {
        // @ts-expect-error For some reason it doesn't like the types?
        plugins: [tailwindcss(), { ...lezer(), enforce: "pre" }],
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
