# fixtures

Test data shared by every implementation of the backend (TypeScript now, maybe Rust later; see `AGENTS.md` §12). Plain JSON, no code.

| Folder | What goes in it |
| --- | --- |
| `rules/` | Input → expected output cases for the pure rules in `backend/src/rules/` and `backend/src/lib/` (money, receipt validation, phone masking, and later alerts, usernames, Arabic normalisation). A port must pass every case. |
| `receipts/` | Real receipt photos with their hand-checked expected JSON, for the A3 accuracy test. Our own or anonymised receipts only. |
| `whapi/` | Real Whapi webhook bodies captured in A1, with phone numbers replaced by fake ones. |

Conventions in `rules/`:

- Money in receipts is EGP exactly as Claude returns it; expected amounts are integer piastres (1 EGP = 100).
- `base_receipt` + a case's `receipt` = the base with the case's top-level keys replaced; `remove` deletes keys after merging.
- Never put real phone numbers, names or customer data here.
