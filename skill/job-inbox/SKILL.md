---
name: job-inbox
description: "Read this when you need to check Gmail for replies to tracked applications and write lifecycle status onto scout/jobs/ dossiers when evidence is strong. Use when the user runs /job-inbox, asks if anyone replied, check application email, update status from inbox, or scan for interview / rejection / offer mail. Read-only on mail; never sends; never asks for confirm. Not for drafting an application (job-apply) or listing dossiers without mail (job-list)."
---

# Job inbox

**Goal: answer one question — which companies I applied to have replied, and
what did they say.** The dossier writes are bookkeeping in service of that
answer. The Phase 6 report is the deliverable.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve `scout/` and every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.

1. Read `./references/flow-inbox.md` now; obey it end-to-end.
2. Dual-load `./references/contract-classify.md` before Phase 3 — sole home of
   match, outcome, transition, write-eligibility, and this skill's refusals.
3. Transport: discover by **capability**, never by a literal tool name. Three are
   required — a stable account identity, search threads by Gmail query, and fetch
   one whole thread with message bodies. A message-level fetch does not qualify;
   Phase 2 needs the thread, and a minimal or metadata view is not a body. The
   identity is the run's `account_uid` and must be the same value on the next run,
   or the re-run skip (contract ## Write item 5) silently re-appends events the
   dossier already holds.
   - Aside: `google-gmail`. Call `googleAccounts.print()` first; pick `uid`
     whose email matches `data/basics.yaml` `email:` when listed; else search
     every `uid`. That `uid` is `account_uid`.
   - Coding agent: search the tool registry for the Gmail connector and load
     its schemas before Phase 2. The server prefix is install-specific — often
     a UUID — so a hardcoded name will miss a connector that is present.
     `account_uid` is the connector's Gmail profile `id`, else its trimmed
     lowercase account email. Print the bound tool names and every bound
     `account_uid` in Phase 0. Any capability missing, identity included → STOP:
     `No Gmail transport available.` Never synthesize an identity, and never
     fall back to a tool name or a literal. Do not copy either API into this
     skill.
4. Candidates and writes: dossiers under `scout/jobs/` only. Identity is
   normalized `url`. Never create a dossier from mail. Never rewrite
   scout-owned body.
5. Writable rows → flow-inbox Phase 5 in this turn (writer suffix `job-inbox`).
   Dossier shape and field ownership come from `job-scout/references/schema-dossier.md`;
   the filesystem transaction comes from `./references/persistence.md`.
   The only disk write this skill ever makes.
6. Emit the Phase 6 report, then STOP.

## References

- Pipeline: `./references/flow-inbox.md` (bind, harvest, record, report)
- Classify contract: `./references/contract-classify.md` (match, outcomes, transitions, write)
- Persistence: `./references/persistence.md` (lock, stage, commit)
