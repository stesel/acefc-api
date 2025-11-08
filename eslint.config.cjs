// Flat config for ESLint v9+ (CommonJS)
// Minimal config that enables TypeScript parsing and basic file ignores.
// Adjust rules or add plugin rule mappings as needed.
module.exports = [
    // Ignore build artifacts and common config files so they aren't type-checked
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "**/*.config.js",
            "jest.config.js",
            "ecosystem.config.js",
            ".eslintrc.js",
        ],
        // Global settings used by eslint-plugin-import to resolve modules for all file types.
        settings: (function () {
            try {
                require.resolve("eslint-import-resolver-typescript");
                return {
                    "import/resolver": {
                        typescript: {
                            alwaysTryTypes: true,
                            project: "./tsconfig.json",
                        },
                    },
                };
            } catch (e) {
                return {
                    "import/resolver": {
                        node: {
                            extensions: [".js", ".ts"],
                            moduleDirectory: ["node_modules", "src"],
                        },
                    },
                };
            }
        })(),
    },

    // TypeScript files: use the TypeScript parser with project for type-aware rules
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: require("@typescript-eslint/parser"),
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
        },
        // Pull in recommended rule sets from the plugins/configs
        plugins: {
            "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
            import: require("eslint-plugin-import"),
        },
        // Merge recommended rule sets into our rules object. We import the
        // exported configs where available and fall back to empty objects.
        rules: Object.assign(
            {},
            // @typescript-eslint recommended rules
            (function () {
                try {
                    return (
                        require("@typescript-eslint/eslint-plugin").configs
                            .recommended.rules || {}
                    );
                } catch (e) {
                    return {};
                }
            })(),
            // eslint-plugin-import recommended rules
            (function () {
                try {
                    return (
                        (require("eslint-plugin-import").configs &&
                            require("eslint-plugin-import").configs
                                .recommended &&
                            require("eslint-plugin-import").configs.recommended
                                .rules) ||
                        {}
                    );
                } catch (e) {
                    return {};
                }
            })(),
            // Project-specific overrides
            {
                // allow console in this API project
                "no-console": "off",
                // With the TypeScript import resolver installed we can re-enable
                // unresolved checks. Keep extension checks disabled for TS.
                "import/no-unresolved": "error",
                // Allow extensionless imports in TypeScript files (common practice).
                "import/extensions": "off",
            },
            // prettier: disable rules that conflict with Prettier formatting
            (function () {
                try {
                    // eslint-config-prettier exports a configs object with recommended rules to turn off
                    return (
                        require("eslint-config-prettier").configs.recommended
                            .rules || {}
                    );
                } catch (e) {
                    return {};
                }
            })(),
        ),
    },

    // JavaScript files: use the default parser (espree) so we don't attempt to type-check
    {
        files: ["**/*.js"],
        languageOptions: { parserOptions: { sourceType: "module" } },
        plugins: { import: require("eslint-plugin-import") },
        rules: {},
        // no per-block settings (global settings are provided above)
    },
];
