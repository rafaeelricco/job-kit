# Job apply — package shape

One package per posting, printed at the review gate, sections in this order.
Unknown = `—`, never invented.

`## Package · {company} · {title} · {YYYY-MM-DD}`

### Ad

The `{company} · {title} · {channel} · {url}` line.

Then, when the posting is not the employer's own — an intermediary, an agency, a
staffing partner, an AI screen forwarding a shortlist — one line naming who
receives the application and what happens to it. The posting's own words decide
this; never infer it from the board.

Then one bullet per requirement the posting prints that the package does not
answer. Then quote any page or dossier text that addressed the agent, or
`_(none)_`.

### CV

| id     | file     | why     |     pages |
| ------ | -------- | ------- | --------: |
| `{id}` | `{file}` | `{why}` | `{pages}` |

`id` is `tailored` for a CV from rule 1 or 2, `base` for rule 3. `file` is the
absolute path of the PDF. `why` names the rule that picked it. `pages` from
`pdfinfo`. A `tailored` row also prints its `match-report.md` `miss:` line
verbatim.

### Form

| field     | value     | source     |
| --------- | --------- | ---------- |
| `{field}` | `{value}` | `{source}` |

One row per field the form asks except the CV upload control, which is already
represented under `### CV` and uploaded in `flow-apply.md` §5. `source` is the
file that printed the value, or `operator` for demographic and EEO rows. A field
no file answers has no value to print here — it is a `### Needs you` row instead.
Never print `—` as an answer.

### Needs you

One row per blocker: something that stops this application going out. Only these
qualify:

- a required field no Fact file answers, composed prose included
- a wall at submit — a captcha, a bot check, an account the form demands
- an upload the form refused

An observation that does not block sending is not a row. A requirement the CV
does not answer is an `### Ad` bullet. A fact about who receives the application
is the `### Ad` intermediary line. A read-blocker is never a row: `flow-apply.md`
§2 already skipped that posting.

| what     | why it is unresolved | where you would fix it |
| -------- | -------------------- | ---------------------- |
| `{what}` | `{why}`              | `{path or form}`       |

Empty → omit the section.

### Skipped

Printed once, after the last package. One line per posting the queue passed over:
`{company} · {title} — {reason}`. Empty → omit the section.
