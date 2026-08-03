# Emit tree

Source = `./templates/` only. Destination = intake target path.

## Tree to write

```
<target>/
  README.md
  data/                 # Fact-law shells + search_packs.yaml
  private/README.md
  private/{impact,projects,interview}/.gitkeep
  scripts/install.sh
  scripts/uninstall.sh
  cv/README.md
```

No skill pack trees inside the profile. Skills come from job-kit install (agents: profile init; Aside: scout/apply).

Copy the entire `./templates/` tree into the target (preserving structure), then
substitute every token in the target tree (all text files):

| Token                   | Intake field      |
| ----------------------- | ----------------- |
| `{{linkedin_username}}` | LinkedIn username |
| `{{display_name}}`      | Display name      |
| `{{email}}`             | Email             |
| `{{github_username}}`   | GitHub username   |
| `{{home_market}}`       | Home market code  |

Make `scripts/install.sh` and `scripts/uninstall.sh` executable (`chmod +x`).

## Leak gate (must pass before checklist)

```bash
rg -n 'rafael-r1cco|rafaelricco@|Ambar|Ashraf|Prevou|Hart|\{\{' "<target>"
```

Any hit → STOP and fix templates or rewrite; do not hand off a dirty tree.
After substitution, no `{{…}}` tokens may remain. Target must not contain skill pack trees.

## After fill

`fill.md` overwrites Fact-law files under `data/` and may place `cv/en-us-resume.pdf`.
It must not write `private/**` or skill trees. Re-run this leak gate after fill.
`private/` remains an empty stub for later; do not remove the tree in this change.
