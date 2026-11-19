# Skill detail pages

## Problem

The catalog provides brief skill descriptions and source links, but it does not
give people a single place to understand a skill before using it or read a local
skill's complete instructions.

## User value

People can assess whether a skill fits their task, understand its provenance,
and inspect its instructions before installing or using it.

## Requirements

- Provide a detail page for every local and external catalog skill.
- Provide curated "What it does" and "When to use it" descriptions for each
  skill.
- Make each detail page shareable at `/skills/<name>`.
- For local skills, make the complete `SKILL.md`, including frontmatter,
  available on the page.
- For external skills, link to the source rather than copying the skill file.
- Distinguish a local skill's copy in this hub from its original source. Link to
  the hub file and show upstream attribution, linking upstream when known.

## UX decisions

- Open skill details on a dedicated page rather than in a dialog or an
  expandable catalog section.
- Render local skill files as Markdown by default, with a switch to view the
  exact raw file.
- Show external skill descriptions and provenance on their detail pages, with a
  link to their source.

## Acceptance criteria

- Every catalog skill can be opened from the hub at its shareable detail URL.
- Each detail page explains what the skill does and when to use it.
- A local skill's page renders its file and can switch to the exact raw
  `SKILL.md`, including frontmatter.
- A local skill's page links to its file in the hub and identifies its upstream
  source; an upstream link is provided when known.
- An external skill's page links to its source without presenting an external
  file as if it were stored in the hub.
- Detail URLs work when opened directly or refreshed.
- Pages retain the hub's accessibility, responsive layout, environment badge,
  and demo notice.

## Open questions

- None from the five decision rounds. Implementation details, including Markdown
  rendering and handling unknown skill URLs, remain to be resolved during
  implementation.
