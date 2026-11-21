# Wafar Asraa — Product spec for the backend

Condensed from the team PRD ("Wafar Asraa — MVP PRD"). This is the scope source of truth for this repo. The app's screens are in `APP_UI_PRD.md`.

## What it is

Wafar Asraa (وفر أسرة) is an AI money assistant that helps Egyptian families in Cairo and Giza spend less on everyday shopping. The MVP is a **WhatsApp bot**: families send a receipt photo or a voice note after shopping, and the assistant tracks spending, remembers their habits, summarises where the money goes and warns before they go over budget. Every receipt also adds real store prices to a shared price database, which later powers price comparison in the app.

## MVP success targets

| Goal | Target |
| --- | --- |
| Active families sending receipts weekly | 25 within 6 weeks of launch |
| Families still active in week 4 | 40% or more |
| Receipts read correctly with no manual fix | 85% or more |
| Unique store prices captured | 2,000 or more |

## Users and launch

- Launch in Cairo and Giza, starting in New Cairo, Nasr City, Sheikh Zayed and 6th of October.
- English and Egyptian Arabic. The bot replies in the user's chosen language; Arabic is Egyptian dialect, not formal Arabic.
- Primary user: the person who does or pays for the household shopping. Other family members join the same family account.

## WhatsApp v1 scope (four features, nothing else)

### Onboarding
1. User messages the number.
2. Bot greets in both languages and asks which to use.
3. Bot asks for first name, a username and the number of people in the home.
4. Bot asks for a monthly household budget (optional; "later" is allowed).
5. One short message explains: send a receipt photo or voice note after shopping.

### 1. Receipt reading
- Photo of a receipt → store, branch, date, every item (name, quantity, unit price, line total) and total.
- Voice note or text for purchases without a receipt ("اشتريت خضار بـ١٥٠ جنيه من السوق").
- Short confirmation: store, total, item count, top category, % of monthly budget used.
- Unreadable photo → ask for a clearer one; never guess.
- Corrections by reply ("the total was 450").
- Items matched to the product catalogue where possible; unmatched items saved for review.

### 2. Spending summary
- On demand: "how much did I spend this week / month?" → totals by category and store.
- Weekly summary, sent only inside the 24-hour window after the user's last message.
- Monthly: total vs budget, top 3 categories, biggest purchase.

### 3. Memory
- Saves facts and reasons the user gives ("we buy extra in Ramadan", "this month is higher because of a birthday").
- An explained overspend is not alerted again for the same reason in that period.
- "What do you remember about me?" lists notes; the user can ask it to forget any of them.

### 4. Overspend alerts
- At 80% and 100% of the monthly budget (and category budgets if set), once each per month.
- When one receipt is unusually high compared with the family's normal pattern.
- Friendly and direct, never shaming. Respects memory.

### Rules for every message
- No links in proactive messages.
- Short, mobile-friendly, minimal emoji.
- Never asks for bank, card or ID details.

## Accounts and family

- One person signs up (WhatsApp number + username) and becomes the **family owner**.
- The owner invites others by username or phone ("add @username"); the invitee must accept.
- One active family per user in the MVP.
- Every member's receipts count toward the shared family budget.
- The owner sees every member's spending; members see their own and the family total.
- A member can leave at any time; their past receipts stay in their own account.

## Data and privacy

- User receipts are the main price source. No Egyptian grocery chain offers a public price API.
- One master product catalogue; each store's price is a separate record (product, store, branch, price, date, source). Matching: barcode first, then name/brand/size, with a human review queue.
- Receipts are personal data. Store prices are shared and contain no personal data. Individual spending is never shown outside the family.
- Users can delete all their data.

## Later phases (do not build now)

- **Phase 1b:** endpoints for the investor app (receipts, spending, family, memory, chat).
- **Phase 2:** production mobile app; move WhatsApp from Whapi to Meta's official Cloud API.
- **Phase 3:** instant shop with price cards, chat shopping assistant with budgets, weekly flyer discounts, store partnerships, savings goals, weekend picks.
- **Phase 3b:** combined delivery (one order, one delivery from several nearby stores).
- **Phase 4:** wallet, with a licensed partner, only once the core is proven.

## Risks to design for

| Risk | Mitigation in the backend |
| --- | --- |
| Whapi number banned (unofficial API) | Gateway behind a trait; reply-first messaging; rate limits; no broadcasts |
| Receipt misreads on Arabic or faded paper | Structured outputs, server-side validation, ask for clearer photos, easy corrections |
| Messy product matching | Barcode first, confirmed aliases per store, review queue |
| WhatsApp message costs later | Proactive messages only inside the 24-hour window |
