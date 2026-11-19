# Skill detail pages

## Problem

The hub's cards provide a short description and a source link, but do not give
visitors enough context to understand a skill before using it or read a local
skill's complete instructions in the hub.

## User value

Visitors can evaluate a skill, understand when it is useful and where it comes
from, and inspect its instructions before deciding whether to install it.

## Requirements

- Provide a detail page for every local skill and external recommendation.
- Add curated explanations of what each skill does and when to use it.
- Identify each skill's source and provide a link to it.
- Show the complete local `SKILL.md`, including frontmatter, in a raw view.
- Also provide a formatted Markdown view of local skill files, using a Markdown
  library for broader syntax support.
- For external skills, link to the source rather than fetching or displaying
  their skill files.
- Preserve the hub's existing accessibility, responsive design, environment
  badge, and demo notice.

## UX decisions

- Each skill has a dedicated, shareable URL.
- Visitors can choose between formatted and raw views of a local skill file.
- External skill pages explain the skill and link to its source; they do not
  promise an in-hub copy of its file.

## Acceptance criteria

- Every catalog skill can be opened from the hub at a shareable URL, and a
  direct visit to that URL shows the same skill.
- Each detail page shows its curated purpose, when-to-use guidance, and source.
- Each local detail page offers both formatted Markdown and the complete raw
  file, including frontmatter.
- Each external detail page links to its source without fetching or displaying
  an external skill file.
- Detail pages remain usable with a keyboard and at mobile widths, and retain
  the environment badge and demo notice.

## Open questions

No product questions remain from the five-round discussion. Implementation
details such as URL format and the Markdown library selection remain open.
