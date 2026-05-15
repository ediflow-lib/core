# ADR-001: Rate Limiting & Payload Size Strategy

**Status:** Accepted  
**Date:** 2026-05-15  
**Context:** API-05 (Rate Limiting) must handle streaming requests fairly without allowing infrastructure abuse through oversized payloads.

---

## Decision

### Rate Limiting

**1 API Request = 1 Rate Limit Count**, regardless of payload size or number of EDI messages in the interchange.

- Rate Limit is checked at request entry (before any data is streamed/parsed)
- A single interchange with 1000 messages counts the same as one with 1 message
- This is simple, predictable, and industry-standard

### Payload Size Limit (per Request)

| Tier | Max Payload |
|---|---|
| Free | 50 KB |
| Starter (€19/Mo) | 1 MB |
| Business (€99/Mo) | 5 MB |
| Enterprise (ab €499/Mo) | 10 MB+ |

- Applies to **all endpoints equally** (parse, validate, build) — no per-endpoint distinction
- Requests exceeding the limit are rejected with `413 Payload Too Large` before processing

### Streaming with Backpressure

- Large interchanges are processed message-by-message (streaming), not loaded entirely into memory
- Backpressure ensures the server only accepts data as fast as it can process
- Memory usage stays constant regardless of interchange size

### Concurrent Request Limit (optional, future)

- Max parallel streams per user (e.g. 5) to prevent CPU blockade
- Not required for MVP, can be added later

---

## Rationale

- **Why count requests, not messages?** Counting messages requires parsing before rate-limiting (chicken-and-egg problem). Requests are countable at the HTTP layer without inspecting content.
- **Why payload size limits?** A single request with 20 MB raw EDI (≈5000 messages) uses significantly more CPU/memory than a 6 KB request. Payload limits prevent abuse without complicating rate-limit logic.
- **Why no per-endpoint limits?** JSON payloads (validate, build) are ~3-5× larger than raw EDI (parse) for the same data. But a universal limit keeps the system simple — 50 MB of raw EDI would be extreme anyway (~8000+ messages).

---

## Consequences

- Users who need to send large interchanges must split them into multiple requests (and rate limit applies)
- Tier upgrades unlock larger payloads and higher rate limits
- Streaming architecture is a prerequisite (API-01 dependency)
- Usage Logging (API-10) tracks request metadata for billing — see `API-10-usage-logging.md`

---

## Dependencies

- API-01 (Parse) must be implemented with streaming support
- API-05 (Rate Limiting) must check payload size before accepting the stream

