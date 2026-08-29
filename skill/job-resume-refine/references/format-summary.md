# Summary — shape

The base's opening prose block: the passage between `\begin{document}` and the
first role, whatever the base calls it. No such block → nothing to recompose,
and the rest of the page is unaffected.

Three sentences, each with a job:

| #   | job                                               | drawn from                                                 |
| --- | ------------------------------------------------- | ---------------------------------------------------------- |
| 1   | the discipline the ad leads with, and how long    | roles that show it; years floored from their `date` fields |
| 2   | the standing angle that makes sentence 1 credible | the base's own block, reusable verbatim                    |
| 3   | one recent proof the ad would care about          | the `claim` or `summary[]` clause whose work the ad raises |

Sentence 1 names a discipline the roles demonstrate. Sentence 3 names
`{company}` and the work — the one place a specific claim earns its keep.

## Altitude

A Summary is a document, read in ten seconds by someone deciding whether to keep
reading. Story frontmatter is written for a different room: a `claim` is one
sentence built to be spoken and questioned, so it often carries mechanism a
Summary cannot. Lift the outcome from it, not the implementation.

Right altitude — what was built, for whom, and what it does:

> a white-label AI sales assistant with real-time voice, RAG chat and
> self-serve onboarding for UK estate agencies

Too deep — mechanism a reader cannot judge without the codebase:

> a fenced JSON payload block that the markdown renderer intercepts and mounts
> as a real card

Stack names belong in Skills, not in the Summary prose. A sentence that lists
four technologies is a Skills row that wandered up the page.

## The block, rendered

```latex
\vspace{-6pt}
\section{Summary}
\begin{itemize}[leftmargin=0.15in, label={}]
  \small\item{
    % 1 — the positioning claim: a discipline stated as expertise, then the
    % span. Not a list of the ad's tokens; name what you are and let the roles
    % below prove it.
    I'm an expert in AI workflows and agent-based systems, with +5 years of
    full-stack experience, most of it on distributed, event-driven systems.
    % 2 — the angle that makes sentence 1 credible. This is the sentence that
    % rarely moves between ads: it is the bridge, not the pitch.
    I originally came from design, so I naturally think about the whole product
    (the user experience, frontend, backend, and how everything fits together).
    % 3 — one recent proof at the altitude above: the employer, and what the
    % thing does for whom.
    Most recently at Ambar, I built a white-label AI sales assistant with
    real-time voice, RAG chat and self-serve onboarding for UK estate agencies.
  }
\end{itemize}
```

The same three moves carry a spoken introduction, which is where the shape came
from — claim, angle, proof — with one addition in a room rather than on a page:
what you are looking for next, and why this company.

## What moves between ads

Sentence 2 does not move; it is the bridge, not the pitch. An ad leading with
`{discipline}` puts that in sentence 1 and draws sentence 3 from the role or
story whose work is `{discipline}`. Both land on Facts already on the page.

## Not a summary

A quoted phrase below is the failure, not a paraphrase of one.

- `I build product front-ends in React, Next.js and TypeScript` — the ad's stack
  read back. Four technologies is a Skills row, not a claim.
- `Passionate, results-driven engineer` — adjectives no Fact prints.
- `It worked`, `the client was happy`, `shipped to production` — not outcomes.
- `I am confident that`, `I believe I could`, `maybe` — hedges and confidence
  theater. State it or leave it out.
- `{n}+ years` where the `date` fields floor to fewer — years round down.
- A number the deck stores as `kind: process` — commits, PRs and files touched
  count the work, not the result.

Specific or it says nothing: a reader who cannot picture the thing you built
cannot judge it, and reaches for the next resume instead.
