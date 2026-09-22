# app

Rules a reviewer can check on a diff. Rationale and examples for most live in `CONVENTIONS.md` and `DESIGN_SYSTEM.md`.

## Types and state

- No `any`, no parameter properties (`erasableSyntaxOnly`). Entity IDs use `Id<Tag>`, not `string & { __brand }`.
- Fallible operations return `Result`. `throw` only for programmer errors and platform boundaries (`JSON.parse`, File System Access, `fetch`).
- Async UI state is `RemoteData`; related state is one union, not loose `isLoading`/`isError` flags.
- Dossier strings read from `scout/jobs/` (`FRONTMATTER_KEYS`, `REQUIRED_SECTIONS`, `OWNERSHIP_MARKER` in `src/module/scout/parse-dossier.ts`) stay verbatim, snake case included.
- Cross-folder imports use the `@components`, `@hooks`, `@lib`, `@module`, `@pages`, `@ui` aliases, not `../../` paths.

## UI

- Scrollable regions use `ScrollArea` from `@ui/scroll-area`, not raw `overflow-auto` containers.
- Radius is 0 except sidebar rows (6px), identifier chips (4px), and avatars (pill).
- Components use semantic color tokens, never the primitive ramps.
- Machine-readable values (ids, paths, URLs, ISO dates, enums, hashes) render in `font-mono`. Prose never does.
- Table counts render with `toLocaleString()` only and right-align with `align: "right"` on the `ColumnDef` plus `tabular-nums`. Composite and interactive cells (a status dropdown, a badge beside a label) keep default alignment.
