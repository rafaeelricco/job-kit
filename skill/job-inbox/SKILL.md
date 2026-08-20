---
name: job-inbox
description: "Read this when you need to check Gmail for replies to tracked applications and write lifecycle status onto scout/jobs/ dossiers when evidence is strong. Never sends mail; never creates a dossier. Use when the user runs /job-inbox, asks if anyone replied, check application email, update status from inbox, or scan for interview / rejection / offer mail. Not for drafting an application (job-apply) or listing dossiers without mail (job-list)."
---

# Job inbox

Answer one question: which tracked applications got mail, and what did it say. The
report is the deliverable; dossier writes serve it.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve `scout/` and every `data/*` path against Profile root (not CWD, not skill dir).
Unreadable required file under a resolved root → stop and say so.

Read `./references/flow-inbox.md` now; obey it end-to-end. It binds the Gmail transport
and loads `./references/contract-classify.md` — the classify contract, sole home of
match, outcome, transition, and write-eligibility law.

Mail is read-only in every phase: never send, draft, reply, label, or mark read. The
only disk write is an existing `scout/jobs/` dossier matched on normalized `url`, and
only the rows the classify contract marks writable. Never create a dossier from mail.
Never ask the operator anything — a gap is a `skip`, never a question.

## References

- Pipeline: `./references/flow-inbox.md` — bind, harvest, classify, record, report
- Classify contract: `./references/contract-classify.md`
- Filesystem transaction: `job-scout/references/persistence.md`
