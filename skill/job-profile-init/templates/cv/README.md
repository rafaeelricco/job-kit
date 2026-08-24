# cv/

Place compiled resume PDFs here for applications:

- One PDF per target role. List them in `../data/cvs.yaml` so job-apply can pick
  one per posting when `adapt_per_vacancy` is false (or no `status: new`
  dossier triggered a chained resume); a PDF in this folder that no registry
  row names is never attached.
- Fallback for job-apply when there is no `new` dossier chain and
  `../data/cvs.yaml` is absent or empty: `en-us-resume.pdf` (must open as PDF)

Never attach a `.tex` source. job-apply does not typeset. A tailored PDF comes
from `job-resume` (chained in Prepare, or a prior standalone `/job-resume`
PASS under `scout/applications/{slug}/`).

`/job-resume` reads a LaTeX base from this folder to compile a tailored PDF into
`scout/applications/{slug}/`. The base is `resume-{default}.tex` for
`../data/cvs.yaml` `default`, else the default row's PDF stem → `.tex`.
job-resume copies that file whole and edits it; it never authors a new base.
The registry still names only the PDF.
