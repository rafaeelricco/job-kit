---
name: job-application
description: "Read this when you need to draft and stage one job application from a posting. Never submit. Use when the user asks to apply, write a cover letter, fill an application form, or stage an Easy Apply; stop at review and wait for an explicit yes."
---

# Job application

Profile root: **same ordered resolver as job-scout** — obey `job-scout/SKILL.md`
Profile root steps (SSOT). Recovery essay: `job-scout/references/profile-root.md`.
Resolve every `data/*` Fact path against that root, not session CWD.
Unreadable Fact file → stop and say so.

1. Read `./references/pipeline.md` now; obey it end-to-end.
2. Dual-load `./references/contract-draft.md` (sole home of Fact, Voice, Gate law):
   - Phases 0–2: bind Fact + Gate + untrusted/bot-check. Voice not until Phase 3 paste.
   - Main opens the posting, so bot-check and untrusted-content bind from the first fetch.
3. Phase 3: every drafting brief carries (1) absolute Profile root, (2) `### Letter plan`,
   (3) full contract pasted **verbatim** (Voice binds with the paste). Never summarize.
4. Facts from the files Fact law names, under the profile root above.
5. One application at a time. Each stops at review and waits for an explicit yes.
6. Deliver the review exactly per `./references/pipeline.md` "Review format", then STOP.

## References

- Pipeline: `./references/pipeline.md` (phases, fit, selection, letter shape, review)
- Draft contract: `./references/contract-draft.md` (Fact > Gate > Voice; drafting paste card)
