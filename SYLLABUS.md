# Syllabus: sections 04 to 06, as shipped

This file plans lesson sections 04 to 06 and records what each one became.
Every section is one self-contained HTML file under `lessons/`. Every section
follows `STYLE.md` and reuses the shared widget chrome from sections 01 to 03.
All three shipped on 2026-09-12.

## Where the course stands

- 01: The machine that prints its own manual. Shipped.
- 02: How the idea got lost. Shipped.
- 03: Two architectures on the same table. Shipped.
- 04 to 06: shipped, and recorded below.

## Section 04: The status line names what happened

Working title: the server's one-line verdict.
Shipped as `lessons/0004-the-status-line-names-what-happened.html`.

### The facts to teach

- Every reply carries a three-digit status code.
- The code is data, not prose. The client reads it without a dictionary.
- Digits are grouped into five classes. 2xx means the request worked.
  3xx means the client must look elsewhere, usually at `Location`.
  4xx means the client erred. 5xx means the server erred.
- Specific codes mark specific meaning. 200 carries a full document.
  201 says the move created a new resource. 204 says the document is
  gone but the state changed. 303 says the answer lives at another URI.
  304 says your stored copy is still good.
- One class answers to one client rule. A generic browser acts on the
  class without knowing each code.
- 404 tells the client the target does not exist in the server state.

### The widget

Ships as "Read the verdict", a status-line reading station built from
`assets/js/widget-0004.js` and `assets/styles/widget-statusline.css`. Eight
request buttons wait on the wire. The learner picks one, names the class the
reply carries, and the station prints the status line, for example
`HTTP/1.1 303 See Other`. Five class buttons cover 1xx through 5xx, so the
station matches the five classes the prose teaches. Naming 4xx on
`GET /account/4042` reveals an offer button that loads `GET /account/4027`
again, which shows the 3xx follow in the same run. Recap numbers the five
classes. The self-check uses four hidden-answer details.

### Cross-section recall

Ask which verdict the kiosk gave when the balance refused $50. Let the
learner match that refusal to 4xx before section 04 explains the class.

## Section 05: Ask without harm. Repeat without doubt.

Working title: safe and idempotent moves.
Shipped as `lessons/0005-ask-without-harm-repeat-without-doubt.html`.

### The facts to teach

- Safe methods change no server state. GET, HEAD, and OPTIONS are safe.
- Unsafe methods may change state. POST, PUT, and DELETE are unsafe.
- Idempotent methods have the same effect whether sent once or twice.
  PUT and DELETE are idempotent. POST is not.
- The properties are separable. A method can be unsafe but idempotent.
  DELETE deletes once; a second DELETE finds nothing to do.
- Safety protects the link. A browser, a preloader, and a search
  crawler may follow a GET without asking first.
- Idempotence protects the retry. A client may repeat a PUT after a
  dropped connection. It must not repeat a POST blindly.
- Riding an unsafe action on GET breaks all of this. RFC 9110 warns
  against actions hidden in query strings, such as `page?do=delete`.

### The widget

Ships as "Sort the methods", in two stations. The first is the shared ledger
from `assets/js/ledger.js`, the same widget section 02 uses. It sorts six
method cards into Safe and Unsafe, then again into Idempotent and Not
idempotent. A wrong placement is allowed and explained, so the learner can
learn from it, and "Check my sort" scores partial work. The second station is
the dropped connection. It sends a payment by POST and a rename by PUT, loses
both replies, and replays each move. The POST lane charges twice, and the PUT
lane lands once.

### Cross-section recall

Section 03 showed the fetch-app drawing moves from its build. Ask the
learner who decides that a GET is harmless when the app, not the
document, owns the moves.

## Section 06: Keep the old copy. Ask if it is still good.

Working title: caching, validators, and the 304 handshake.
Shipped as `lessons/0006-keep-the-old-copy-ask-if-it-is-still-good.html`.

### The facts to teach

- Fielding adds the cache constraint to the stateless style. A response
  is labeled cacheable or not, and a cache may reuse it for later,
  equivalent requests.
- The default follows the method. A retrieval response is cacheable.
  Other responses are not. Control data may override the label.
- Caching works because each URI is its own state. The server keeps no
  session per connection. Two identical GETs to one URI are equivalent.
- Time-based freshness decides reuse first. `Expires`, `max-age`, and
  `Age` say how long a copy stays fresh.
- Validation decides reuse second. `Last-Modified` and `ETag` serve as
  copy fingerprints. `If-None-Match` sends the fingerprint back.
- A matching fingerprint earns a 304. The reply carries no body. The
  client keeps its stored copy and refreshes its age.

### The widget

Ships as "Ask if it changed", a hidden server in the page built from
`assets/js/widget-0006.js` and `assets/styles/widget-cache.css`. It owns one
weather document and its ETag. Three buttons drive it. "Fetch the document"
earns a 200 and stores the copy. A second fetch while that copy is fresh is
served from the cache and sends no request at all, which teaches freshness
before validation. "Let an hour pass" ages the copy past its max-age, and the
next fetch sends `If-None-Match` and earns a 304 with no body.
"Change the server state" rotates the ETag from v1 to v2, so the next fetch
after that earns a 200 and the new body. The learner reads the handshake in the
log.

### Cross-section recall

Sections 01 and 03 made the kiosk and the explorer re-render documents
on every move. Ask why those documents are not cached clients. Let the
learner spot that each move changes the URI or the document, so the
cached copy would go stale.

## Sources, as the sections cite them

- Fielding, "Architectural Styles and the Design of Network-based
  Software Architectures", 2000. Chapter 5.1.4 covers the cache
  constraint. Chapter 5.1.5 defines the uniform interface: resource
  identification, representations, self-descriptive messages, and
  hypermedia as the engine of application state. The sections link
  <https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm>.
- RFC 9110, HTTP Semantics, June 2022. Section 9.2.1 defines safe
  methods. Section 9.2.2 defines idempotent methods. Section 15 lists
  the status codes. Section 15.4.5 covers 304 Not Modified. Section
  8.8.3 defines ETag. Section 13 covers conditional requests.
- RFC 9111, HTTP Caching, June 2022. Section 3 covers response
  storage. Section 4.2 covers freshness. Section 4.3 covers validation.
- RFC 8297, Early Hints, 2017. Section 04 names 103 from this
  specification.
- IANA HTTP Status Code Registry, for the full code list.
- MDN Web Docs, the HTTP status, methods, and caching pages, as a
  second voice on each specification.

## Build notes, as applied

- Each section reuses the shared reveal, progress, and caption chrome.
- Each section carries the foot navigation link to the next section.
- Each section has a card on `lessons/index.html` and on the home page,
  and the blurbs match `scripts/manifest.json` word for word.
- Every widget is self-contained. No section calls a remote service.
  The simulation server lives inside the page.
