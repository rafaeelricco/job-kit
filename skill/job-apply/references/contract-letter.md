# Letter contract

Paste this file verbatim as `CONTRACT` when loading `job-humanize`.

## Shape

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

The carrying project is the one whose stack overlaps the ad most; at most two
supporting facts. Slot 6 fires only when geo, authorization, or engagement is unmet.
A skill gap belongs in slot 2 or 3.

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

- Ship a number only when a story's frontmatter prints it as a verified outcome.
- A process number counts activity (PRs, LOC, commits, review comments, commit share). It never ships, as a digit or in words. `Dozens of PRs` is the same banned number spelled differently.
- No such number → qualitative outcome only. Never estimate, never turn a date range into an achievement.

### Credit

- Keep the source's person. A claim that says `we` stays `we`. Never promote it to `I`.
- Never invent facts about the team, codebase, or hiring reason. Slot 2 may sharpen only a requirement printed in the ad.

### Surface

- No em dash in sent text. Use a comma, colon, or full stop.
- No hedge (`maybe`, `I think`, `I believe I could`) and no confidence theater (`I am confident that`).
- Cut exact dates, internal praise, and titles of people who noticed.

### Close

- Slot 6 states the position, hands the decision back, and stops. Never apologize, ask for an exception, or fold it into slot 7.
- Slot 7 is an ask, never a thank-you or a courtesy wait. `I look forward to hearing from you` is the failure.

## Forbidden claims

Every `never_say` entry in `data/stories/*.md` frontmatter, exact or semantically
equivalent, in the letter, the subject line, and every staged free-text value.
