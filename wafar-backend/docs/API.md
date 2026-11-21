# HTTP API

The routes, status codes and JSON shapes below are the contract (AGENTS.md §12). A future Rust version must keep them.

## GET /health

No auth. `200 {"status":"ok","db":"ok"}`, or `503 {"status":"degraded","db":"error"}` when the database does not answer within 2 s.

## POST /demo/shopping-list

For the investor web demo only (not the WhatsApp bot). Reads a photo of a shopping list with Claude and matches each line to the catalogue the demo sends. Nothing is stored.

- **Enabled** when `DEMO_API_ENABLED=true`, or when it is unset and `APP_ENV=local`. Needs `ANTHROPIC_API_KEY`; uses `CLAUDE_RECEIPT_MODEL`.
- **Auth:** none. Limited to 20 requests per visitor (first `X-Forwarded-For` address) per 10 minutes, in memory per instance.
- **Body limit:** about 6 MB. The demo resizes photos to a long edge of 1568 px before sending.

Request:

```json
{
  "image": { "media_type": "image/jpeg", "data": "<base64, no data: prefix>" },
  "catalogue": [{ "id": "milk", "name": "Full cream milk", "name_ar": "حليب كامل الدسم" }]
}
```

`media_type` is `image/jpeg`, `image/png` or `image/webp`. `catalogue` has 1–200 entries; `id` matches `^[a-z0-9_-]{1,40}$`, names are 1–80 characters.

`200` response:

```json
{
  "kind": "shopping_list",
  "language": "ar",
  "issues": [],
  "items": [
    { "raw_text": "لبن ٢", "name_en": "milk", "quantity": 2, "unit": null, "product_id": "milk" },
    { "raw_text": "طماطم", "name_en": "tomatoes", "quantity": 1, "unit": "كيلو", "product_id": null }
  ],
  "basket": {
    "lines": [{ "product_id": "milk", "quantity": 2 }],
    "unmatched": ["طماطم"]
  }
}
```

- `kind`: `shopping_list`, `receipt` or `other`. Only a shopping list has items and basket lines.
- `issues`: any of `blurry`, `cut_off`, `partly_unreadable`.
- `items[].product_id` is always an id from the request's catalogue, or `null`.
- `basket.lines`: one line per product, in written order, quantity a whole number from 1 to 99 (rules in `fixtures/rules/shopping_list.json`). `basket.unmatched`: the written text of lines with no match.

Errors (JSON `{"error": "..."}`):

| Status | `error` | When |
| --- | --- | --- |
| 400 | `invalid_request` | Body is not JSON or does not match the request shape |
| 413 | `too_large` | Body over the limit |
| 422 | `unreadable` (+ `reason`: `refused`, `too_long`, `invalid_output`) | Claude declined, ran out of room twice, or returned the wrong shape |
| 429 | `rate_limited` | Too many requests from this visitor |
| 502 | `ai_unavailable` | The Claude call failed (network, rate limit, API error) |
| 503 | `not_configured` | Demo API turned off, or `ANTHROPIC_API_KEY` missing |
