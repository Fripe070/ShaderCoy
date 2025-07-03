// @ts-check

/** @type {import("prettier").Config} */
export default {
    plugins: ["prettier-plugin-astro"],
    overrides: [
        {
            files: "*.astro",
            options: {
                parser: "astro",
            },
        },
    ],
    useTabs: false,
    tabWidth: 4,
    printWidth: 100, // I am aware this isn't a max lenght, but I like longer lines
};
