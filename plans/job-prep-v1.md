# job-prep v1 — separate preparing from submitting

## Context

Discovery runs 33×/day unattended; application only runs when the operator is at
the keyboard. Throughput is ≈1/day against 203 hot dossiers. Fix: a nightly cron
that does everything except the click, a morning digest, and a `--yolo` submit
lane that consumes the prepared plan.

## Ground truth (measured 2026-09-03, corrects the draft)

| Claim in draft                     | Measured                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| 581 dossiers, 558 new              | 585 — 562 `new`, 18 `applied`, 5 `rejected`                                      |
| 205 hot (193 ats / 7 dm / 5 email) | 203 hot — 191 `ats`, 7 `dm_request`, 5 `direct_email`                            |
| 438 August                         | 461 August `first_seen`, 124 September                                           |
| 51 folders / 44 PDFs               | 50 folders, 51 PDFs, 46 `match-report.md`                                        |
| "liveness: 301 → dead, as we know" | only **5** dossiers carry a dead log line — the sweep is effectively unpopulated |
| 33 scout + 1 match + 1 inbox = 35  | 33 total: 30 scout/match/inbox + 3 LinkedIn (different workdir)                  |

Throughput claim holds: all 18 `applied` have August `first_seen`, none from
September.

**The draft's unlock is wrong.** PR #78 does not persist ResumeGuidance. `job-match`
builds it in-run for displayed jobs (`flow-match.md:98-112`, `state.guidance`) and
prints it; `job-resume-refine` scaffolds and validates _its own_ fresh guidance
(`flow-refine.md:57-71`). Zero guidance artifacts exist on disk. So prep does not
inherit a precomputed projection — it still pays the refine cost. The real unlock
is that guidance is now deterministic and script-validated, so refine can run
**unattended** without a human reading the report. Cost moves off the critical
path because prep is nightly, not because it was cached.

**Two laws block the draft as written:**

1. `job-apply` write-set is `scout/jobs/` only, after a confirmed submission;
   `scout/applications/` is written by a chained refine "under its own law"
   (`job-apply/SKILL.md:22-24`). A prep phase that writes `package.md` cannot live
   inside `job-apply`. It needs its own skill with its own declared write-set.
2. `flow-apply.md` §3 rule 1 re-chains `job-resume-refine` whenever `status: new`
   and `adapt_per_vacancy` is true. Rule 2 only fires when rule 1 produced no PDF.
   A `--yolo` submit run would therefore **recompute the CV and can attach a
   different PDF than the one approved**. Rule 0 below closes that.

## Diffs

### 1. Teach job-apply to consume a prepared plan

```diff
# skill/job-apply/references/flow-apply.md:86
 Exactly one CV per application, first match:

+0. `scout/applications/{slug}/plan.json` exists, its `schema_version` is `1`, its
+   `url` normalizes equal to this dossier's `url`, and its `cv` path opens as a
+   PDF → print `Prepared plan · {slug} · {prepared_at}` and take that PDF. Never
+   re-refine: the approved package named these bytes. A plan whose `url` does not
+   match, or whose `cv` does not open, is ignored entirely — fall through to
+   rule 1.
+
 1. `adapt_per_vacancy` is true and this dossier's frontmatter `status:` is `new`
    → print `Chained job-resume-refine · {filename}` and spawn one isolated child:
```

```diff
# skill/job-apply/references/flow-apply.md:121
 Stage a value for every field the form asks, each from the file
 `contract-screening.md` names. Demographic and EEO rows are `operator` and stay
 blank. A field no file answers is not staged: it is a `### Needs you` row.
+
+When rule 0 took a prepared plan, stage `plan.json` `fields[].value` for the
+fields whose `selector` still exists, and re-derive only fields the live form
+added. A field the plan carries whose selector is gone is dropped, not guessed.
+A plan whose `needs_you` is non-empty never reaches here — prep withheld it.
```

```diff
# skill/job-apply/SKILL.md:22
-Write-set: `scout/jobs/` only, and only after a confirmed submission
-(`flow-record.md`). A chained `job-resume-refine` writes
-`scout/applications/{slug}/` under its own law.
+Write-set: `scout/jobs/` only, and only after a confirmed submission
+(`flow-record.md`). A chained `job-resume-refine` writes
+`scout/applications/{slug}/` under its own law. `scout/applications/{slug}/plan.json`
+is read-only input here; only `job-prep` writes it.
```

### 2. `skill/job-prep/SKILL.md` (new)

```markdown
---
name: job-prep
description: "Prepare application packages offline for hot dossiers: revalidate the live ad, read the form's fields, resolve each against profile Facts, chain job-resume-refine, and write plan.json plus package.md for later approval. Use when the user runs /job-prep or a nightly prep cron fires. Not for submitting (job-apply), scoring (job-match), or searching (job-scout)."
argument-hint: "[--top N | <file>... | --channel ats|dm_request|direct_email]"
---

# Job prep

Prepares, never posts. Every phase of `job-apply` §§2-4 runs here; §5 does not
exist in this skill.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Write-set: `scout/applications/{slug}/` only — `plan.json`, `package.md`, and the
chained refine's own outputs. `scout/jobs/`, `data/`, and `cv/` are read-only;
the dossier stays `status: new` until `job-apply/references/flow-record.md` runs.

Read `./references/flow-prep.md` now.

## Hard refuses

- Click any control that posts, saves, or creates an account — including "Save
  draft" and "Continue" past the last read-only step
- Write `scout/jobs/`, `data/`, or `cv/`
- Author a cover letter, essay, or composed free-text answer
- Emit a plan for a posting whose ad did not read this run
```

### 3. `skill/job-prep/references/flow-prep.md` (new)

```markdown
# Prep — pipeline

Select → Liveness → Read → CV → Fields → Plan.

## 1. Select

`--top N` (default 8) → dossiers with `status: new`, `bucket: direct`,
`score >= 8`, no dead log line, no readable `plan.json`, oldest `first_seen`
first. `--channel` filters. Explicit `<file>` tokens override selection.

Print `Prep queue: {n}`.

## 2. Liveness

HEAD/GET the `url`. A 3xx to the board index, a 404, or page text that prints
expired / filled / withdrawn / not accepting → append nothing, print
`dead · {slug}`, and add the slug to this run's `### Dead` list. The dossier is
NOT edited — the dead line is `job-scout`'s to write.

## 3. Read · 4. CV · 5. Fields

Obey `job-apply/references/flow-apply.md` §2, §3, §4 verbatim, with `--yolo`
absent and §5 unreachable. `contract-screening.md` remains the answer law.
Read the form's fields; record for each: `selector`, `label`, `type`,
`required`, staged `value`, and the `source` file. Never click a control that
posts.

## 6. Plan

Write `scout/applications/{slug}/plan.json` per `./references/schema-plan.md`
and `package.md` per `job-apply/references/format-package.md` — the same package
that is printed at the chat gate, written to file instead.

A posting with any `needs_you` row still gets both files, and its slug goes to
`### Needs you`, not to the digest-eligible list. Eligible = `needs_you` empty
and `cv` opens as a PDF.

Print, in order: `### Prepared` (slug · company · title · channel),
`### Needs you`, `### Dead`, `### Skipped`.
```

### 4. `skill/job-prep/references/schema-plan.md` (new)

```json
{
  "schema_version": 1,
  "slug": "2026-09-03-tribuesk--full-stack-engineer",
  "url": "https://boards.greenhouse.io/tribuesk/jobs/4012",
  "ats": "greenhouse",
  "channel": "ats",
  "prepared_at": "2026-09-03T02:14:00Z",
  "cv": "/root/personal/job-kit-profile/scout/applications/{slug}/Rafael_Ricco_..._Resume.pdf",
  "fields": [
    {
      "selector": "#first_name",
      "label": "First name",
      "type": "text",
      "required": true,
      "value": "Rafael",
      "source": "data/basics.yaml"
    },
    {
      "selector": "#job_application_answers_2",
      "label": "Salary expectation (USD/mo)",
      "type": "text",
      "required": true,
      "value": "7500",
      "source": "contract-screening.md salary row 3"
    }
  ],
  "needs_you": [],
  "submit_selector": "#submit_app",
  "walls": []
}
```

- `url` is the normalized URL per `job-scout/references/schema-dossier.md`; it is
  the identity `job-apply` rule 0 matches on.
- `source` is a Fact-file path or `operator`. `operator` rows carry `"value": null`
  and force a `needs_you` entry when the form marks them required.
- `walls[]` records a captcha or account wall seen on the apply path — non-empty
  `walls` implies a `needs_you` row.
- No prose, no cover letter, no score, no verdict.

### 5. ATS field profiles (new, one per board)

**`skill/job-prep/references/ats/greenhouse.md`** (also `lever.md`, `ashby.md`)

```markdown
# Greenhouse — stable field map

| selector                                               | label           | source                              |
| ------------------------------------------------------ | --------------- | ----------------------------------- |
| `#first_name`                                          | First name      | `data/basics.yaml`                  |
| `#last_name`                                           | Last name       | `data/basics.yaml`                  |
| `#email`                                               | Email           | `data/basics.yaml`                  |
| `#phone`                                               | Phone           | `data/basics.yaml`                  |
| `#resume` (file)                                       | Resume          | plan `cv`                           |
| `input[autocomplete=off][id^=job_application_answers]` | custom question | resolve per `contract-screening.md` |

The map is a starting guess, never authority: the live form's fields win, and a
selector that is absent this run is dropped from the plan. Custom questions are
per-posting and are never cached across companies.
```

### 6. Cron — two new jobs, hours 02 and 10 are free

```diff
# ~/.hermes/cron/jobs.json  (via cronjob_manage, not hand-edited)
+{
+  "name": "Job prep",
+  "schedule": "0 2 * * *",
+  "skills": ["job-profile-root", "job-prep"],
+  "prompt": "/job-prep --top 8",
+  "model": "grok-4.6", "provider": "xai-oauth",
+  "workdir": "/root/personal/job-kit-profile",
+  "deliver": "telegram:-5306593662"
+}
+{
+  "name": "Job apply · digest",
+  "schedule": "0 10 * * *",
+  "skills": ["job-profile-root", "job-list"],
+  "prompt": "Read every scout/applications/*/plan.json whose needs_you is empty and whose slug's dossier is still status: new. Print the digest, newest prepared_at last. No browser, no writes.",
+  "model": "grok-4.6", "provider": "xai-oauth",
+  "workdir": "/root/personal/job-kit-profile",
+  "deliver": "telegram:-5306593662"
+}
```

Contention: 02:00 and 10:00 are the only two empty hours across all 33 jobs
(03:00 is the next fire after prep). Prep must run in its own named browser
session so a scout tab is never stolen, and must cap at `--top 8` to stay inside
the hour. The digest lands 60 min before `Job match` at 11:00.

### 7. Digest shape

```
Prepared · 5 · 2026-09-03

1. Senior Full-stack · TribuESK · $7.5k/mo
   direct_email · CV: React, Node.js, AWS
   not evidenced: —

2. Frontend Engineer · ioet · —
   greenhouse · CV: Next.js, TypeScript, Docker
   not evidenced: GraphQL

Reply: "send 1 2 4" · "all" · "no"
Needs you: 2 (cover letter · captcha)
```

The reply is a chat turn, not a cron. `send 1 2 4` maps to
`/job-apply --yolo <file1> <file2> <file4>`; rule 0 makes each run skip refine
and submit the approved bytes. Unanswered plans persist and reprint the next
morning — nothing expires, nothing sends itself.

### 8. Non-ATS lane (12 dossiers)

`dm_request` (7) and `direct_email` (5) need no form. `--channel dm_request`
prep writes `plan.json` with `ats: null`, `fields: []`, and the outbound draft
produced by `job-pitch` + `job-humanize` stored as `outbound.md`. Approval and
`flow-record.md` are unchanged; `channel` on the log line is already
`direct_email` / `dm_request`.

## Verify

```bash
# rule 0 does not fire on a mismatched plan
python3 -c "import json;p=json.load(open('scout/applications/<slug>/plan.json'));print(p['schema_version'],p['url'])"

# prep wrote only applications/
cd /root/personal/job-kit-profile && git status --short | grep -v '^?? scout/applications/' | head

# dossier untouched by prep
grep -c '^status: new' scout/jobs/<slug>.md

# digest candidates
ls scout/applications/*/plan.json | wc -l
```

First real proof: run `/job-prep --top 2` by hand, confirm two `plan.json` files,
`git status` clean outside `scout/applications/`, then `/job-apply --yolo` one of
them and confirm the log prints `Prepared plan · {slug}` instead of
`Chained job-resume-refine`.

## Volume

191 ATS-channel hot dossiers ÷ 8 prepared/night ≈ 24 nights, before September
inflow. The 12 non-ATS ones clear in two nights on their own lane.
