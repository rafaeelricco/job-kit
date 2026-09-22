import tseslint from "typescript-eslint"
import sonarjs from "eslint-plugin-sonarjs"

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "reports/**",
      ".stryker-tmp/**",
      "node_modules/**",
      "**/*.d.ts",
      // Copied verbatim from job-kit-ai; linted there.
      "src/lib/{callable,trampoline,result,maybe,list,future,tree-map,tree-set,time,types,remote-data}.ts",
      "src/lib/json/**",
      "src/lib/helpers/**",
    ],
  },
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"],
    languageOptions: { parser: tseslint.parser },
    plugins: { sonarjs },
    rules: {
      "sonarjs/cognitive-complexity": ["error", 10],
    },
  }
)
