import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import importPlugin from "eslint-plugin-import"

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: "opensellpy/base",
    files: ["**/*.ts"],
    plugins: { import: importPlugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "import/no-cycle": "error",
    },
  },
  {
    name: "opensellpy/core-bookkeeping",
    files: [
      "packages/core/**/*.ts",
      "**/*provider.ts",
      "**/*mapper.ts",
    ],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
    },
  },
  {
    name: "opensellpy/core-no-platform",
    files: ["packages/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@mixos-go/*"], message: "core tidak boleh import SDK platform manapun" },
            { group: ["@opensellpy/adapter-*"], message: "core tidak boleh import dari packages/adapters" },
            { group: ["@opensellpy/client"], message: "core tidak boleh import dari packages/client" },
            { group: ["**/adapters/**"], message: "core tidak boleh import dari packages/adapters" },
            { group: ["**/client/**"], message: "core tidak boleh import dari packages/client" },
          ],
        },
      ],
    },
  },
  {
    name: "opensellpy/client-no-adapter",
    files: ["packages/client/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@opensellpy/adapter-*"], message: "client tidak boleh import dari packages/adapters (harus DI/register dari luar)" },
            { group: ["**/adapters/**"], message: "client tidak boleh import dari packages/adapters" },
          ],
        },
      ],
    },
  },
  {
    name: "opensellpy/adapter-no-adapter",
    files: ["packages/adapters/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@opensellpy/adapter-*"], message: "satu adapter tidak boleh import adapter lain" },
            { group: ["**/adapters/*/"], message: "satu adapter tidak boleh import adapter lain" },
          ],
        },
      ],
    },
  },
)
