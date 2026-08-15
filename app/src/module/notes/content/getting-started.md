---
title: "Getting Started"
description: "Adding a note page."
---

## Adding a page

Create a file under `src/module/notes/content/`. The path maps directly to the
URL:

- `index.mdx` → `/notes`
- `getting-started.md` → `/notes/getting-started`
- `guides/deploy.mdx` → `/notes/guides/deploy`

Frontmatter needs `title`; `description` is optional.

## Why two extensions

Use `.md` for plain prose — angle brackets like `a < b` are safe. Use `.mdx`
when the page needs JSX components.
