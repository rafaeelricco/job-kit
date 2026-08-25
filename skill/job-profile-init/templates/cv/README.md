# cv/

Place the compiled resume PDF here for applications:

- One PDF, named by `../data/cvs.yaml` `base`. job-apply attaches it when
  `adapt_per_vacancy` is false (or when no `status: new` dossier triggered a
  chained resume).
- Fallback for job-apply when there is no `new` dossier chain and
  `../data/cvs.yaml` is absent or `base` is empty: `en-us-resume.pdf` (must open
  as PDF)

Never attach a `.tex` source. job-apply does not typeset. A tailored PDF comes
from `job-resume-refine` (chained in Prepare, or a prior standalone
`/job-resume-refine` PASS under `scout/applications/{slug}/`).

`/job-resume-refine` reads a LaTeX base from this folder to compile a tailored
PDF into `scout/applications/{slug}/`. The base is the `base` stem with `.tex`.
job-resume-refine copies that file whole and edits it; it never authors a new
base. `cvs.yaml` still names only the PDF.
