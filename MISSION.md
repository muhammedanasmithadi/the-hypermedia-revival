# Mission: Hypermedia: The Architecture We Forgot

## Why
Teach the deep domain knowledge behind hypermedia systems, the original architecture of the web, so that developers can make informed architectural decisions instead of defaulting to SPA frameworks out of habit. This matters because the web development industry is course-correcting after a decade of unnecessary complexity, and understanding *why* (not just *what*) is the real skill.

## Success looks like
- A reader understands what HATEOAS actually means and why Fielding designed it
- A reader can describe the loop: request, document, choice, next document
- A reader can weigh a document-driven design against a JSON feed for the same feature
- A reader can read a reply: the status line, its five classes, and the codes that matter
- A reader can sort a method by safety and by idempotence, and say when a retry is safe
- A reader can describe the cache handshake: freshness first, then the 304 that keeps the copy
- A reader can evaluate whether their next project actually needs a client-side framework

## Constraints
- Static, hand-authored pages: no external dependencies, no build tools on the page
- Self-contained, browser-runnable sections with interactive machines
- No technology advocacy: present the landscape, don't push a framework
- Deep domain knowledge, not surface-level takes

## Out of scope
- Step-by-step HTMX tutorial (this is architecture exploration, not a how-to guide)
- Framework wars (React vs HTMX is not the point)
- Mobile-native SDUI deep dive (focus on web architecture)
