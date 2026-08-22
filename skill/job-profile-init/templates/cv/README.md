# cv/

Place compiled resume PDFs here for applications:

- One PDF per target role. List them in `../data/cvs.yaml` so job-apply can pick
  one per posting when no `status: new` dossier triggered a chained resume; a
  PDF in this folder that no registry row names is never attached.
- Fallback for job-apply when there is no `new` dossier chain and
  `../data/cvs.yaml` is absent or empty: `en-us-resume.pdf` (must open as PDF)

Never attach a `.tex` source. job-apply does not typeset. A tailored PDF comes
from `job-resume` (chained in Prepare, or a prior standalone `/job-resume`
PASS under `scout/applications/{slug}/`).

`/job-resume` reads a LaTeX base from this folder to compile a tailored PDF into
`scout/applications/{slug}/`. Name that base `resume-{id}.tex` for the
`../data/cvs.yaml` row id it belongs to, or give the row's PDF a sibling of the
same stem (`x.pdf` → `x.tex`). The registry still names only the PDF, and
job-kit never generates the base for you.
