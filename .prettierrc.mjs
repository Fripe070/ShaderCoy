// @ts-check

/** @type {import("prettier").Config} */
export default {
    plugins: ["prettier-plugin-astro", "@trivago/prettier-plugin-sort-imports"],
    overrides: [
        {
            files: "*.astro",
            options: {
                parser: "astro",
            },
        },
        {
            files: "*.{yml,yaml}",
            options: {
                tabWidth: 2,
            },
        },
    ],
    useTabs: false,
    tabWidth: 4,
    printWidth: 100,
};
