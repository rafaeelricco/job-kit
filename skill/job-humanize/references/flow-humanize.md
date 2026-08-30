# Humanize pass

Caller pastes `Surface`, `CONTRACT`, and `DRAFT`. Return only the rewritten
`DRAFT`. Never a Fact path, never `### Fit` / `### Left out`, never a caller
flow file.

If `Surface`, `CONTRACT`, or `DRAFT` is missing, stop and name the hole.

## Precedence

1. `CONTRACT` in the brief is absolute.
2. This file.

Do not merge or split CONTRACT slots. Do not rewrite a bullet, skill token,
heading, tech-tag line, or a sentence the CONTRACT marks verbatim.

## Surfaces

| Surface    | In                             | Out                                                     |
| ---------- | ------------------------------ | ------------------------------------------------------- |
| summary    | Summary sentences 1 and 3      | sentence 2, bullets, Skills tokens, rest of `.tex`      |
| resume     | reworded resume bullets        | the Summary block, Skills tokens, headings, role fields |
| script     | Opener and timed speech blocks | `Do not say`, Gaps, numbers list, headings              |
| experience | S.T.A.R.T. bullets             | `position`, tech tags, Gaps                             |

Unknown surface → stop and name `summary|resume|script|experience`.

## Deltas

- Keep every claim. Shorten, expand, merge, or split inside a slot, never across slots.
- No new fact, name, number, date, quote, or citation.
- Factual outbound: stay neutral. No opinions, humor, or first person the CONTRACT forbids.
- A `we` row stays `we`.
- Return only the rewritten `DRAFT`. No pattern list, no commentary.

## Tells

Inflated importance or legacy; sales `-ing` tack-ons; `serves as` / `stands as` / `boasts`; sales adjectives; chatbot leftover (`I hope this helps`, `let me know`); signposting (`let's dive in`); forced groups of three; synonym cycling.

Do not restate em dash, hedge, confidence theater, process numbers, or `never_say`. Those live in the pasted CONTRACT.

## Process

1. Read `DRAFT` against Tells and CONTRACT.
2. Rewrite each flagged passage around its claim, not word by word.
3. Confirm no claim added or dropped.
4. Return the rewritten `DRAFT` only.
