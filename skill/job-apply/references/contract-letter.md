# Letter contract

Paste this file verbatim into the Phase 3 drafting brief. The only evidence available
to the drafter is the completed `### Letter plan`; do not read files, use memory, or
recover claims from `### Left out`.

## Precedence

1. Fact evidence in the Letter plan is absolute.
2. Ad requirements and formats in the plan beat Voice law.
3. Voice law governs everything else.

## Letter shape

Fixed order. Unfired slots are absent, not empty.

| Slot        | Fires       | Content                                                                                           |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------- |
| 1 Authority | always      | The system built that the ad describes; never a title or years                                    |
| 2 Piercing  | always      | The problem behind a direct requirement, sharpened only from the ad                               |
| 3 Method    | always      | The decision inside the carrying project and what it replaced                                     |
| 4 Proof     | always      | The resulting outcome, not an activity                                                            |
| 5 Bridge    | conditional | One supporting fact, at most two sentences, answering a requirement the carrying project does not |
| 6 Terms     | conditional | Geo, authorization, or engagement position, with the decision handed back                         |
| 7 Ask       | always      | One sentence proposing the conversation                                                           |

Slot 6 fires only for a `none` Fit row covering geo, authorization, or engagement.
A skill gap belongs in slot 2 or 3; a geo or authorization gap belongs in slot 6.

## Voice law

### Open

- First sentence states the fit. Never open on interest, enthusiasm, or the act of writing. `I am writing to express my interest` is the failure.

### Address

- Slots 1 and 2 open on the reader, not on `I`.

### Method and proof

- Slot 3 names what was chosen and what it replaced. A sentence that only names what was built is not a method.
- Slot 4 is the resulting outcome. `It worked`, `the client was happy`, and `shipped to production` are not proof.
- Prefer the verb a human would say over a resume compound noun.

### Number firewall

- Ship a number only when the Letter plan prints it.
- A process number counts activity (PRs, LOC, commits, review comments, commit share). It never ships, as a digit or in words. `Dozens of PRs` is the same banned number spelled differently.
- No number in the plan → qualitative outcome only. Never estimate, never turn a date range into an achievement.

### Credit

- Keep the plan's person. A plan that says `we` stays `we`. Never promote it to `I`.
- Never invent facts about the team, codebase, or hiring reason. Slot 2 may sharpen only a requirement printed in the ad.

### Surface

- No em dash in sent text. Use a comma, colon, or full stop.
- No hedge (`maybe`, `I think`, `I believe I could`) and no confidence theater (`I am confident that`).
- Cut exact dates, internal praise, and titles of people who noticed.

### Close

- Slot 6 states the position, hands the decision back, and stops. Never apologize, ask for an exception, or fold it into slot 7.
- Slot 7 is an ask, never a thank-you or a courtesy wait. `I look forward to hearing from you` is the failure.

## Forbidden claims and checker

Reject any exact or paraphrased claim semantically equivalent to a `### Forbidden claims`
entry. Scan the letter, subject line, form notes, and any other outbound free-text value.

## Checker (verify)

Every check is `pass`, `fail`, or `unjudgeable`. Unjudgeable → `reject` for the run.
LETTER_TEXT empty, or a brief with no `### Letter plan` → `unjudgeable`.

| #   | Check                                                                                    | fail is  |
| --- | ---------------------------------------------------------------------------------------- | -------- |
| 1   | every factual claim traces to one exact `### Letter plan` row                            | `reject` |
| 2   | no `### Forbidden claims` hit, exact or semantic, in the letter or any staged free-text  | `reject` |
| 3   | no relation the plan does not print: cause, scale, audience, leadership, credit          | `reject` |
| 4   | the plan's person is kept: a `we` row stays `we`, never promoted to `I`                  | `reject` |
| 5   | every number ships from a plan row                                                       | `reject` |
| 6   | a staged free-text value answers only its question and cites nothing outside the plan    | `reject` |
| 7   | no process number, as digit or words                                                     | `repair` |
| 8   | every fired slot present, every unfired slot absent, in slot order                       | `repair` |
| 9   | first sentence states fit, not interest and not the act of writing                       | `repair` |
| 10  | slots 1 and 2 open on the reader, not on `I`                                             | `repair` |
| 11  | slot 3 names what was chosen and what it replaced; slot 4 is an outcome, not an activity | `repair` |
| 12  | no em dash, no hedge, no confidence theater; slot 7 is an ask, not a thank-you           | `repair` |
| 13  | the ad's stated subject, links, salary, project count, and length are followed           | `repair` |

Pick exactly one Outcome, first match:

1. any check `unjudgeable` or `reject`-class `fail` → `reject`
2. else any `repair`-class `fail` → `repair`
3. else `pass`

Never warn-and-pass a `reject`. A `reject` means the evidence is wrong and planning must
run again; do not weaken the contract or fill the gap from memory. A `repair` names what
must change, never the replacement wording.

## Output sections

```
### Outcome
{pass|repair|reject}

### Checks
| check | result | evidence |
result ∈ pass | fail | unjudgeable

### Repairs
{what must change, not the wording — or _(none)_}
```
