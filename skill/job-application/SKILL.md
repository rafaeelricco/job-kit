---
name: job-application
description: "Read this when you need to draft, stage, and after explicit approve submit one job application from a posting. Use when the user asks to apply, write a cover letter, fill an application form, or Easy Apply; stop at review; on yes submit (account wall, required terms, Submit) then record success to the scout store."
---

# Job application

Profile root: same ordered resolver as job-scout — steps SSOT in `job-scout/SKILL.md`.
On STOP / resolve fail: `job-scout/references/profile-root.md`.
Resolve every `data/*` Fact path against that root, not session CWD.
Unreadable Fact file → stop and say so.

1. Read `./references/pipeline.md` now; obey it end-to-end.
2. Dual-load `./references/contract-draft.md` (sole home of Fact, Voice, Gate law):
   - Phases 0–2: bind Fact + Gate + untrusted. Voice not until Phase 3 paste.
   - Main opens the posting, so untrusted-content binds from the first fetch.
3. Phase 3: every drafting brief carries (1) absolute Profile root, (2) `### Letter plan`,
   (3) full contract pasted **verbatim** (Voice binds with the paste). Never summarize.
4. Facts from the files Fact law names, under the profile root above.
5. One application at a time. Each stops at review and waits for an explicit yes.
6. Deliver the review exactly per `./references/pipeline.md` "Review format", then STOP.
7. On explicit yes: pipeline Phase 4 — SUBMIT (account + terms + Submit as contract
   allows). On submit success evidence — or when the operator confirms they submitted
   outside the agent: Phase 5 — RECORD.
   Same-session success: `status: applied`, one log line, and the full review on the
   dossier (opening one when the store has none). Later session (no `### Ad` /
   review in context): re-identify first, use the real submission date, preserve
   any advanced lifecycle status, and write the abbreviated `record not available`
   placeholder — never rewind `interview`/`offer`/`rejected`/`dropped` to
   `applied`, never reconstruct the review. Write law per
   `job-scout/references/dossier.md`. The only disk write this skill ever makes.

## References

- Pipeline: `./references/pipeline.md` (phases, fit, selection, letter shape, review, submit, record)
- Draft contract: `./references/contract-draft.md` (Fact > Gate > Voice; drafting paste card)
