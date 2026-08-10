<!--
Everything inside this comment is spec, never printed. Print the bullets below
after Activate, or when the Activate ask was No.

They are the literal print template: fill every {{…}} per activate.md step 9,
never leave an unresolved placeholder, never invent a CWD-relative kit
`scripts/...` from a profile dir. An empty optional placeholder (GAPS_LINE /
CV_LINE) is omitted entirely, never printed blank.
-->

- {{ACTIVATE_NOTE}}
- {{KIT_INSTALL}}

{{GAPS_LINE}}

- Day-2 edits: `/job-profile-config` — show your profile, change keywords,
  positions, locations, or boards without hand-editing YAML.
- Scout packs live in your profile (`data/search_packs.yaml`); tune formulations
  there or via `/job-profile-config packs`. The copy inside the job-scout skill is
  only a fallback and is overwritten on every kit reinstall.

{{CV_LINE}}

- LinkedIn browser session must match `data/profiles.yaml` LinkedIn username.
- Additional details captured during init are preserved in
  `data/observations.yaml`; scout and application ignore this file.
- After a scout run persists, `/job-tracker` reads `scout/jobs/` back — dossiers
  and application status — without writing to it.
