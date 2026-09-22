/** Shared denominator for critical coverage and mutation testing. */
export const criticalSources = [
  "src/domain/note/**/*.ts",
  "src/domain/{auth,user}/**/*.ts",
  "src/app/auth/**/*.ts",
  "src/app/{handleCommand,handleQuery,handleProjection,idempotency,responses,engine,resolveAuth,session}.ts",
  "src/lib/event-delivery.ts",
  "src/lib/password-hash.ts",
  "src/lib/event-sourcing/**/*.ts",
  "src/lib/postgres.ts",
]

export const thresholds = { lines: 80, statements: 80, functions: 80, branches: 70 }
