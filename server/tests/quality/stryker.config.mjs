import { criticalSources } from "./sources.mjs"

export default {
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { configFile: "vitest.config.ts" },
  mutate: criticalSources,
  coverageAnalysis: "perTest",
  thresholds: { high: 80, low: 70, break: 70 },
  reporters: ["clear-text", "html", "json"],
  htmlReporter: { fileName: "reports/mutation/mutation.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  concurrency: 4,
  timeoutMS: 10000,
  // Reports and Docker-only scenarios are not mutation-test inputs.
  ignorePatterns: ["reports", "tests/integration"],
}
