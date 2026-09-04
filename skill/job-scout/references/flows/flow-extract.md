# Job scout — extract

Batches of 5, one URL at a time, same host serialized. Listed URLs only. No page → no field.

Open the full posting before copying: expand every collapsed or truncated
block ("read more" / "show more" / accordions) and scroll to the end. A JD
still truncated after expansion → `status=uncertain`, never partial facts.

A posting that redirects → replace the row's URL with the landed canonical URL
(`location.href`, else `link[rel=canonical]`), re-normalize per
`job-store/references/schemas/schema-dossier.md`, and fold it into an existing row for that URL before
persisting.

`### Verified`: search columns plus schema Posting facts keys except `blocker`, and `status_reason`, `role_snapshot`, `role_do`, `role_must`.

`status` ∈ `live` | `dead` | `uncertain`. Copy printed names. `required_skills` from the requirements section; never a closed bag; never intersect the profile. Role cells per `job-store/references/schemas/schema-dossier.md`.
