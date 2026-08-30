# Refine report

Write `{dir}/match-report.md` and print it. job-apply reads `verdict:` and the
`miss:` line; the rest is for the operator.

    # Refine · {company} · {title} · {YYYY-MM-DD}

    verdict: **PASS**

    source: {dossier filename} | live URL, no dossier | pasted ad text
    bullets: {kept} of {pool} · roles: {kept}/{base} ({dropped} dropped)
    summary: recomposed | base block kept | base has none
    skills: {count}/{ceiling} tokens ({in} in, {out} out) · ad tokens: {hit}/{total}
    page: 1 · {pct}% trailing · base: {n}p · {.tex}{, pdf stale}
    miss: {ad token, …} | _(none)_

    ## Changes

    | change | what | why |
    | ------ | ---- | --- |
    | dropped role | {company} | {the ad never raises this work} |
    | dropped bullet | {company} · {first ~50 chars}… | {discipline the ad never raises} |
    | reworded | {company} · {first ~50 chars}… | {ad says React, pool said React.js} |
    | added bullet | {company} · {first ~50 chars}… | {story claim the ad raises} |
    | skills | {token} in/out/spelling | {ad leads with it / stuffing / alias} |
    | summary | sentence {1|3} | {story claim the ad raises / years floored from dates} |

Empty Changes → `_(none)_`.
