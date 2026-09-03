# plan.json

One file per prepared posting at `scout/applications/{slug}/plan.json`. Written
only by `job-prep`; read by `job-apply/references/flow-apply.md` §3 rule 0 and
by `job-prep --digest`.

```json
{
  "schema_version": 1,
  "slug": "2026-09-03-tribuesk--full-stack-engineer",
  "url": "https://boards.greenhouse.io/tribuesk/jobs/4012",
  "ats": "greenhouse",
  "channel": "ats",
  "prepared_at": "2026-09-03T02:14:00Z",
  "cv": "/root/personal/job-kit-profile/scout/applications/2026-09-03-tribuesk--full-stack-engineer/Rafael_Ricco_Full_Stack_Engineer_Resume.pdf",
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

- `url` is the normalized URL per `job-scout/references/schema-dossier.md`
  "URL normalize"; it is the identity rule 0 matches on.
- `slug` is the dossier filename minus `.md`.
- `ats` is derived from the URL host: `greenhouse` (`greenhouse.io`), `lever`
  (`lever.co`), `ashby` (`ashbyhq.com`), else `other`; `null` when `channel` is
  not `ats`.
- `channel` is the dossier's frontmatter value.
- `prepared_at` is UTC ISO-8601 with a `Z` suffix.
- `cv` is an absolute PDF path under `scout/applications/{slug}/`.
- `fields[].source` is a Fact-file path, a `contract-screening.md` row, or
  `operator`. `operator` rows carry `"value": null` and force a `needs_you`
  entry when `required` is true.
- `needs_you[]` entries are `{ "what": "...", "why": "...", "where": "..." }`,
  the three columns of the package's `### Needs you` table.
- `walls[]` records a captcha or account wall seen on the apply path as a
  string; non-empty `walls` implies a `needs_you` entry.
- `submit_selector` is recorded, never clicked, and `null` when not found.
- No prose, no cover letter, no score, no verdict.
