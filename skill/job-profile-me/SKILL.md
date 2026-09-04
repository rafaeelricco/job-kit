---
name: job-profile-me
description: "Read this when you need to view or change an existing job-search profile without hand-editing YAML. Use when the user runs /job-profile-me, asks to show their profile or search config, change positions / locations, add or remove a job board, or asks what is missing for scout. Not for creating a profile (job-profile-init) or finding jobs (job-scout)."
---

# Job profile me

Edit an existing profile.

Profile root: load the `job-profile-root` skill now; obey it end-to-end.

Resolve every `data/*` path against Profile root (not CWD, not skill dir).
Skill-local files: `./references/**` only.

Write-set: `data/job_search.yaml`, `data/profile_card.yaml`, `data/search_packs.yaml`,
`data/cvs.yaml`, and their `*.yaml.tmp` staging siblings during atomic rename.

When the operator asks to create a profile / set one up from a CV, hand off
`job-profile-init`, then end this skill.
When the operator asks to find jobs / scout openings, hand off `job-scout`, then
end this skill.
When the operator mutates search config, packs, the profile card, or CV settings
(`set` / `packs` / `refresh-card` / `cvs set`), or asks to change salary, notice,
visa, sponsorship, EOR, Fact fields, or identity, read `./references/flows/flow-mutate.md` now.
Otherwise read `./references/flows/flow-show.md` now.
Load each additional reference only when that flow names it.
