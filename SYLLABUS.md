# Syllabus: Sections 04 to 06

This file plans the next three lesson sections. Each section becomes one
self-contained HTML file under `lessons/`. Every section follows
`STYLE.md` and uses the shared widget chrome from sections 01 to 03.

## Where the course stands

- 01: The machine that prints its own manual.
- 02: How the idea got lost.
- 03: Two architectures on the same table.
- 04 to 06: planned here.

## Section 04: The status line names what happened

Working title: the server's one-line verdict.

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

Plan: "Read the verdict". A tray of scenario cards, each like the kiosk
moves. The learner reads a request, names the class, and the card flips
to the real code. Recap numbers the classes. Self-check uses the
hidden-answer detail element.

### Cross-section recall

Ask which verdict the kiosk gave when the balance refused $50. Let the
learner match that refusal to 4xx before section 04 explains the class.

## Section 05: Ask without harm. Repeat without doubt.

Working title: safe and idempotent moves.

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

Plan: "Sort the methods". Two trays sort method cards into safe and
unsafe, then again into idempotent and not. A second pass replays a
lost connection. The learner sees a repeated POST charge twice and a
repeated PUT leave the same state.

### Cross-section recall

Section 03 showed the fetch-app drawing moves from its build. Ask the
learner who decides that a GET is harmless when the app, not the
document, owns the moves.

## Section 06: Keep the old copy. Ask if it is still good.

Working title: caching, validators, and the 304 handshake.

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

Plan: "Ask if it changed". A hidden server in the page owns a document
and its ETag. The learner clicks to fetch twice. The first click earns
200 with the full body. The second click sends `If-None-Match` and
earns 304 with an empty body. A change button rotates the ETag, so the
next fetch earns 200 again. The learner reads the handshake in the log.

### Cross-section recall

Sections 01 and 03 made the kiosk and the explorer re-render documents
on every move. Ask why those documents are not cached clients. Let the
learner spot that each move changes the URI or the document, so the
cached copy would go stale.

## Sources to cite

- Fielding, "Architectural Styles and the Design of Network-based
  Software Architectures", 2000. Chapter 5.1.3 covers the cache
  constraint. Chapter 5.1.5 defines the uniform interface: resource
  identification, representations, self-descriptive messages, and
  hypermedia as the engine of application state.
- RFC 9110, HTTP Semantics, June 2022. Section 9.2.1 defines safe
  methods. Section 9.2.2 defines idempotent methods. Section 15 lists
  the status codes. Section 15.4.5 covers 304 Not Modified. Section
  8.8.3 defines ETag. Section 13 covers conditional requests.
- RFC 9111, HTTP Caching, June 2022. Section 3 covers response
  storage. Section 4.2 covers freshness. Section 4.3 covers validation.
- IANA HTTP Status Code Registry, for the full code list.

## Build notes

- Each section reuses the shared reveal, progress, and caption chrome.
- Add the foot navigation link to the next section when it lands.
- Add a card on `lessons/index.html` when a section ships.
- Keep every widget self-contained. No section may call a remote
  service. The simulation server lives inside the page.