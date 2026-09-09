# Job scout — extract

Batches of 5, one URL at a time, same host serialized. Listed URLs only. No page → no field.

Open the full posting before copying: expand every collapsed or truncated
block ("read more" / "show more" / accordions) and scroll to the end. A JD
still truncated after expansion → `status=uncertain`, never partial facts.

A posting that redirects → replace the row's URL with the landed canonical URL
(`location.href`, else `link[rel=canonical]`), re-normalize per
`job-store/references/schemas/schema-dossier.md`, and fold it into an existing row for that URL before
persisting.

`### Verified`: search columns plus schema Posting facts keys except `blocker` and `eligibility`, and `status_reason`, `role_snapshot`, `role_do`, `role_must`. `eligibility_evidence` is the one printed sentence that says where the hire may live or be employed from (`Remote, anywhere in Canada`, `must reside in South America`); `—` when none is printed. Never compose it from two places.

Before gate, run `job-store/scripts/validate_extract.py` from the job-store skill root — launcher as `job-store/references/schemas/schema-dossier.md` "URL normalize" — with `{"rows": [<one object per Verified row, url plus every Posting facts key>]}` on stdin. It prints `{"rows": [{"url", "errors": [...]}]}` in the same order, or `{"validate_error": …}` with exit 1. A row with a non-empty `errors` list → Gaps `extract invalid: {first error}`, drop; the remaining rows continue. A `validate_error` or unreadable script → name it and end; write nothing this run.

`status` ∈ `live` | `dead` | `uncertain`. Copy printed names. `required_skills` from the requirements section; never a closed bag; never intersect the profile. Role cells per `job-store/references/schemas/schema-dossier.md`.
