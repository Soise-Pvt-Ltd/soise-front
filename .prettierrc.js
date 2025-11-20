/** @type {import("prettier").Config} */
module.exports = {
    // Add your standard Prettier configuration options here
    // For example:
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 2,

    // --- Plugin Configuration ---
    // The plugin is listed here
    plugins: ['prettier-plugin-tailwindcss'],
    // --- End Plugin Configuration ---


};