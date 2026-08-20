# cv/

Place compiled resume PDFs here for applications:

- One PDF per target role. List them in `../data/cvs.yaml` so job-apply can pick
  one per posting; a PDF in this folder that no registry row names is never attached.
- Fallback for job-apply when `../data/cvs.yaml` is absent or empty:
  `en-us-resume.pdf` (must open as PDF)

Never attach a `.tex` source. Build tooling is operator-owned; job-apply does not
generate LaTeX.
