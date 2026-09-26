# Hypermedia Systems — Resources

## Knowledge

### Primary Sources
- [Roy Fielding's Dissertation: "Architectural Styles and the Design of Network-based Software Architectures" (2000)](https://ics.uci.edu/~fielding/pubs/dissertation/fielding_dissertation.pdf)
  The origin of REST. Chapter 5 defines the architectural style. Use for: HATEOAS definition, REST constraints, hypermedia architecture.
- [The same dissertation, HTML edition](https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm)
  The version sections 01 to 06 cite. Use for: per-section citation links.
- [Ted Nelson's "Literary Machines" (1981)](https://en.wikipedia.org/wiki/Project_Xanadu)
  Coined "hypertext" and "hypermedia." Use for: historical context of hypertext vision.
- [The Original HTTP/1.0 Spec (RFC 1945)](https://www.ietf.org/rfc/rfc1945.txt)
  The protocol that instantiated Fielding's hypermedia architecture. Use for: understanding what HTTP was designed to do.

### Specs the Sections Cite
- [RFC 9110: HTTP Semantics (2022)](https://www.rfc-editor.org/rfc/rfc9110.html)
  Section 9.2.1 safe methods, 9.2.2 idempotent methods, 15 status codes, 8.8.3 ETag, 13 conditional requests. Cited by sections 04, 05, and 06.
- [RFC 9111: HTTP Caching (2022)](https://www.rfc-editor.org/rfc/rfc9111.html)
  Section 3 response storage, 4.2 freshness, 4.3 validation. Cited by section 06.
- [RFC 8297: Early Hints (2017)](https://www.rfc-editor.org/rfc/rfc8297.html)
  Defines 103. Cited by section 04.
- [IANA HTTP Status Code Registry](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)
  The full code list. Cited by section 04.
- [MDN Web Docs: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
  The status, methods, and caching pages. The second voice each section cites beside the RFCs.

### Analysis & Criticism
- [Two-Bit History: "Roy Fielding's Misappropriated REST Dissertation" (2020)](https://twobithistory.org/2020/06/28/rest.html)
  How "REST" became "JSON over HTTP" and Fielding's ideas were misunderstood. Use for: the misappropriation narrative.
- [Carson Gross: "When Should You Use Hypermedia?" (2022)](https://htmx.org/essays/when-to-use-hypermedia/)
  Nuanced analysis of when hypermedia fits and when it doesn't. Use for: tradeoff analysis.
- [Carson Gross: "Hypermedia On Whatever you'd Like" (2023)](https://htmx.org/essays/hypermedia-on-whatever-youd-like/)
  The HOWL stack concept and JavaScript pressure. Use for: architectural alternatives.
- [arXiv: "The Case for HTML First Web Development" (2026)](https://arxiv.org/html/2602.17193v1)
  Academic paper on HTML-first development. Use for: evidence-based argument.

### Landscape & Adoption
- [The HTMX Renaissance (reptile.haus, 2026)](https://reptile.haus/journal/htmx-renaissance-hypermedia-web-development-2026/)
  Industry perspective. 2026 adoption numbers: 23% of devs, 350% growth, 47K+ GitHub stars. Use for: industry perspective. The percentages are the author's estimates; the star count is verifiable.
- [Pinggy: "HTML over WebSockets" (2026)](https://pinggy.io/blog/html_over_websockets_web_moves_back_to_server/)
  Comprehensive landscape of HTML-over-the-wire in 2026. Use for: current implementations.
- [Server-Driven UI 2026 Research (GitHub)](https://github.com/Dxlxz/universal-design-system/blob/main/docs/research/top-server-driven-ui-2026.md)
  Decision matrix for SDUI approaches. Use for: comparison data.

### Books
- [Hypermedia Systems by Gross, Stepinski, & Akşimşek (2023–2025)](https://hypermedia.systems/)
  Free online. The definitive book on hypermedia-driven applications. Use for: comprehensive reference.
- [REST in Practice by Webber, Parastatidis & Robinson (2010)](https://www.oreilly.com/library/view/rest-in-practice/9781449383312/)
  Practical REST including HATEOAS. Use for: practical implementation patterns.

## Wisdom (Communities)

- [r/htmx](https://reddit.com/r/htmx)
  Active community, balanced discussion. Use for: real-world implementation questions.
- [Hypermedia Systems (official site)](https://hypermedia.systems)
  Official site for the book and its community. Use for: direct engagement with the hypermedia revival movement.
- [SE Radio 671: Carson Gross on HTMX (2025)](https://se-radio.net/2025/06/se-radio-671-carson-gross-on-htmx/)
  Nuanced interview covering philosophy and engineering tradeoffs. Use for: understanding the thinking behind the movement.

## Gaps
- No comprehensive academic survey of HTML-over-the-wire vs JSON SDUI vs RSC tradeoffs exists yet
- Limited production case studies from large-scale hypermedia deployments (beyond anecdotal reports)
- No formal benchmarking study comparing TTI across architectural approaches in 2026