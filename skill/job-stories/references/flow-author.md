# Author (add)

One story per confirm cycle. Print `Profile root: /abs/path` before the first diff.

## Evidence gate

1. Ask which moment, and where the evidence lives: a repo path, a PR, the CV, or
   the operator's own account. No source → STOP; never draft from chat memory.
2. Read what the operator named. A repo → git log, blame, PR bodies. Nothing else.
3. Every claim that reaches `evidence.*` traces to something read in step 2 or to
   an explicit operator statement recorded in `sources`.

## Four parts

Draft `evidence.problem`, `evidence.decision`, `evidence.difficulty`,
`evidence.impact`. Then `claim`, conclusion first.

Specific or it says nothing: `difficulty` names the failure modes, including what
was tried and failed. "It was hard but I solved it" is a rejected draft.

## Adversarial pass

Before the diff, run against the draft and the sources:

1. Every number → `verified` and `kind`. Cannot verify → `unverified`.
2. Every claim a reference check could break → `never_say` entry with the reason.
   Client names appearing only as test fixtures always land here.
3. Every credit that belongs to someone else → `never_say`.
4. Anything the operator would rather not be shown → `volunteer`.
5. Derive `status` per `./schema-story.md`.

A story with an empty `never_say` after this pass means the pass did not run.

## Write

Unified diff in a fenced `diff` block anchored to `<file>:<line>`. Wait for an
explicit **yes**. Silence, a question, or edits are not a yes. Edits → re-draft
and re-diff.

On yes: if `data/stories/` is missing, create it (`mkdir`) after confirming that
path is Profile root `data/stories/` (never a path outside the writable set).
Then render to a sibling `<slug>.md.tmp`, re-parse its frontmatter, then rename
over the target. Parse failure → delete the staged file, say nothing was written,
name the error. Never edit a live file in place. Print `wrote <abs path>` and the
derived `status`.
