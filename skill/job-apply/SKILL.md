---
name: job-apply
description: "Prepare one job application from a posting, then submit it after explicit approval and record only confirmed submission. Use for cover letters, application forms, and Easy Apply; not for reply tracking."
---

# Job application

Load `job-profile-root` first and resolve every profile path against its canonical
root, never the session CWD. Work on one posting at a time.

| State   | Opens when                                                                   | Authority and mutation                                                                               |
| ------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Prepare | A posting or application request is available                                | Read `./references/prepare.md`; read-only profile and browser navigation; stage proposed values only |
| Submit  | The operator explicitly approves the current review                          | Read `./references/submit.md`; live browser fields, attachments, terms, and submission               |
| Record  | Clear success evidence or explicit `sent`/`submitted`/`applied` confirmation | Read `./references/record.md`; dossier-store writes only                                             |

Read `./references/screening.md` only when the posting or live form asks about
salary, authorization, sponsorship, employment route, work location, assessments,
background checks, or related screening. The operator owns demographic and EEO fields.

Prepare emits the complete review and stops. Submit does not open until explicit
approval. Record does not open until submission is confirmed. A bare `done` or `ok`
does not confirm submission. After Record closes, load `job-inbox` in this session
on its default candidate set. Its report is this run's last output. An inbox stop
is not an apply failure — the record already landed.

## References

- `./references/prepare.md`: ad, duplicate check, fit, selection, letter plan, draft checker, and review
- `./references/letter-contract.md`: verbatim drafting contract for plan-only evidence and voice
- `./references/screening.md`: conditional salary and screening rules
- `./references/submit.md`: post-approval browser order
- `./references/record.md`: confirmed-application dossier update, then the inbox leg
