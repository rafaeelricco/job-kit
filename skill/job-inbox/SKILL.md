---
name: job-inbox
description: "Check Gmail for replies to tracked applications, report outcomes, and update existing dossiers on strong evidence. Use for /job-inbox or application-email status. Never sends mail or creates dossiers. Not for job-apply or job-list."
---

# Job inbox

Answer which tracked applications received mail.

1. Load `job-profile-root`; resolve `scout/` and `data/*` against its
   root. An unreadable required path stops the run.
2. Read `./references/flow-inbox.md`; it loads the classifier when needed.
3. Discover Gmail capabilities for stable account identity, query search, and
   complete-thread body fetch. Message-level, minimal, or metadata fetch is
   invalid. For Aside, call `googleAccounts.print()` and use its `uid`; choose
   the account matching `data/basics.yaml` `email:` when listed, otherwise use
   every `uid`. For a coding agent, use the current Gmail profile `id`, falling
   back to its trimmed lowercase email. Print bound accounts/tools and carry
   `(account_uid, thread_id)` on every row. Missing any capability stops with
   `No Gmail transport available.`
4. Mail is read-only. Existing dossiers only, keyed by normalized URL; only
   classifier-approved lifecycle status and Application-log writes may occur.
5. Emit the pipeline report, then stop.
