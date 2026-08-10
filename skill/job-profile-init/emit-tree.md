# Emit tree

Source = `./templates/` only. Destination = intake target path.

## Tree to write

```
<target>/
  README.md
  data/                 # Fact-law shells, search deck + observations
  cv/README.md
```

No skill pack trees inside the profile. Skills come from job-kit install (agents: profile init; Aside: scout/apply).

Copy the entire `./templates/` tree into the target (preserving structure), then
substitute every token in the target tree (all text files):

| Token                   | Approved identity |
| ----------------------- | ----------------- |
| `{{linkedin_username}}` | LinkedIn username |
| `{{display_name}}`      | Display name      |
| `{{email}}`             | Email             |
| `{{github_username}}`   | GitHub username   |
| `{{home_market}}`       | Home market code  |

## Leak gate (must pass before checklist)

Always screen for unsubstituted tokens:

```bash
rg -n '\{\{' "<target>"
```

When a donor fed this flow — a source of truth taken from someone else's
checkout, or a scaffold copied from an existing profile — ask the operator which
terms identify that donor (names, emails, handles, employers, client names) and
screen for those too:

```bash
rg -n '<donor-term>|<donor-term>' "<target>"
```

Any hit → STOP and fix templates or rewrite; do not hand off a dirty tree.
After substitution, no `{{…}}` tokens may remain. Target must not contain skill pack trees.

## After fill

`fill.md` overwrites Fact-law files under `data/` and may place `cv/en-us-resume.pdf`.
It must not write skill trees or any path outside the emitted layout (`data/`, `cv/`,
root README). Re-run this leak gate after fill.

`job-scout` Phase 6 creates `scout/` under Profile root at first run. It is not
emitted here and never a Gap; this flow neither creates nor reads it.

## Unfilled inventory (what the template ships blank)

`fill.md` applies the questionnaire buffer. Scaffold-only still runs the
questionnaire; if every field is skipped, SKILL step 4.8 prints **only the
scout-critical lines below** as Gaps — never `none`, and never optional shells
(preferences, projects, languages, CV).

- `data/job_search.yaml`: `positions` (`Software Engineer` placeholder),
  `keywords.primary` (`TODO-skill`), `locations`
- `data/candidate.yaml`: `salary_expectations.salary_range_usd`,
  `availability.notice_period`, `legal_authorization.*`,
  `employment_routes.employer_of_record`

Optional shells still blank in the tree (not Gaps): other `employment_routes.*`,
`work_preferences_from_resume.*`, experiences/projects/skills/languages/basics
empties, `cv/en-us-resume.pdf`, and `data/observations.yaml`.

`data/observations.yaml` is optional human-only detail storage and is never a Gap.

`data/search_packs.yaml` ships every pack `enabled: true` and is runnable as
emitted — never a Gap, including on scaffold-only.
