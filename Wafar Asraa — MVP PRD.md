# Wafar Asraa — MVP PRD

Nov 1, 2026 · @David

## Overview

Wafar Asraa (وفّر أسرة) is an AI money assistant that helps Egyptian families spend less on everyday shopping. The MVP is a WhatsApp bot that reads receipts, remembers each family's habits, summarises spending and warns when they go over budget.

**Problem.** Food and household prices in Egypt keep rising, and most families have no easy view of where their money goes or where the same basket is cheaper nearby. Budget apps exist, but people stop logging expenses within weeks.

**Our answer.** Make tracking effortless: snap a receipt or send a voice note on WhatsApp, and the assistant does the rest. Every receipt also feeds a local price map, which later powers price comparison and store suggestions.

**Vision.** The family money dashboard for Egypt: track, compare, save, and later hold savings in an in-app wallet once the core is proven.

## Goals and success metrics

The MVP must prove one thing: families will keep sending receipts, and the data they send is good enough to build on.

| Goal | Metric | MVP target |
| --- | --- | --- |
| Families actually use it | Active families sending a receipt in a given week | 25 within 6 weeks of launch |
| It becomes a habit | Families still sending receipts in week 4 | 40% or more |
| Receipt reading works | Receipts parsed correctly with no manual fix | 85% or more |
| Price data builds up | Unique product prices captured across Cairo and Giza | 2,000 or more |
| Users find it useful | Users who say the summary changed how they shop | 50% or more in a short survey |
| Investor readiness | Pitch deck and clickable app prototype | Done before the investor meeting |

Targets are starting guesses to revisit after the first two weeks of real use.

## Target users and launch area

We launch in Cairo and Giza, in English and Egyptian Arabic.

- **Primary user:** the person who does or pays for the household shopping, usually a parent managing a monthly budget.
- **Family members:** spouse, adult children or relatives added to the same family account so spending is seen together.
- **Who they are:** middle-income households who shop at supermarkets, discount chains and local grocers, and who already live on WhatsApp.
- **Language:** the bot replies in the language the user writes in. Arabic replies use Egyptian dialect, not formal Arabic.

Price data is local, so early user recruitment should cluster in a few districts first (for example New Cairo, Nasr City, Sheikh Zayed and 6th of October) rather than spread thinly across both cities.

## Phasing

WhatsApp goes live first to prove the core; the app is built alongside as the investor prototype and becomes the users' main home later.

1. **Phase 1 — WhatsApp v1 (live users).** Receipt reading, spending summary, memory and overspend alerts. Runs on Whapi.
2. **Phase 1b — App prototype (investors).** Expo app showing the full vision: home with savings message, instant shop with price cards, chat shopping assistant, family dashboard, spending history. Shares the same backend and database as the bot.
3. **Phase 2 — App launch and migration.** App goes to users. WhatsApp stays as the quick input channel. App-only features and a bonus free month pull users across. Move WhatsApp to Meta's official Business API.
4. **Phase 3 — Compare and save.** The full shopping experience (see Shopping experience): instant shop with price cards, chat shopping assistant that works to a budget, weekly flyer discounts, store partnerships, savings goals ("save 10k in 3 months"), weekend café and restaurant suggestions.
5. **Phase 3b — Combined delivery.** One order, one payment, one delivery from several nearby stores, piloted in one district first (see Combined delivery).
6. **Phase 4 — Wallet.** In-app wallet or savings account, only after the core is proven and with a licensed partner.

**Pricing:** free during the MVP. When paid tiers start, every new user gets a 2-month free trial, then basic (free) and premium tiers.

## WhatsApp v1 scope

Four features, nothing else: receipt reading, spending summary, memory and overspend alerts.

### 1. Onboarding

1. User messages the number (from a link, QR code or a friend).
2. Bot greets in English and Arabic, asks which language to use.
3. Bot asks for a first name, a username and how many people are in the family.
4. Bot asks for a monthly household budget (optional, can skip and set later).
5. Bot explains in one short message: send a receipt photo or a voice note after shopping.

### 2. Receipt reading

- User sends a **photo of a receipt**. The AI extracts store name, branch (if printed), date, each item (name, quantity, unit price, line total) and the total.
- User can also send a **voice note** or text for purchases with no receipt ("اشتريت خضار ب١٥٠ جنيه من السوق").
- Bot replies with a short confirmation: store, total, number of items, top category, and how much of the monthly budget is used.
- If the photo is unreadable, bot asks for a clearer photo instead of guessing.
- User can correct a mistake by replying ("the total was 450").
- Each item is matched to the product catalog where possible; unmatched items are saved for later review.

### 3. Spending summary

- **On demand:** user asks "how much did I spend this week/month?" and gets totals by category and by store.
- **Weekly:** a short summary sent within the 24-hour window after a user's message where possible, to keep message costs down.
- **Monthly:** total spent vs budget, top 3 categories, biggest single purchase.

### 4. Memory

- The bot remembers facts and reasons the user gives: "we buy extra in Ramadan", "this month is higher because of a birthday".
- When the user explains an overspend, the bot saves the reason and does not alert again for the same reason in that period.
- Memory notes are stored per user and per family, and the user can ask "what do you remember about me?" and ask it to forget something.

### 5. Overspend alerts

- Alert when spending passes 80% and 100% of the monthly budget, or a category budget if set.
- Alert when a single receipt is unusually high compared with the family's normal pattern.
- Tone is friendly and direct, never shaming ("You've used 85% of this month's budget with 9 days left").
- Alerts respect memory: if the user gave a reason, no repeat alert for that reason.

### Rules for every message

- No links in proactive notifications (only in replies the user asked for).
- Short messages, mobile-friendly, emojis kept minimal.
- The bot never asks for bank, card or ID details.

## Accounts and family model

One person signs up, gets a username, and adds other users as family members.

- Every user has their own account and username, tied to their WhatsApp number.
- The person who creates the family is the **family owner**. Owners can invite members by username or phone number.
- A member must accept the invite before joining. A user belongs to one family at a time in the MVP.
- Each member's receipts count toward the shared family budget and summaries.
- The owner can view every member's spending habits; members see their own spending and the family total.
- A member can leave the family at any time; their past receipts stay in their own account.

In WhatsApp v1, inviting works by message ("add @username"). The app later shows the full family dashboard.

## Data strategy

User receipts are the main price source; no Egyptian grocery chain offers a public price API to third parties.

| Source | What it gives | When |
| --- | --- | --- |
| User receipts | Item, price, store, branch, date — free, real, local | Phase 1 |
| Voice notes and text | Purchases with no receipt (markets, kiosks) | Phase 1 |
| Weekly supermarket flyers | Current discounts, read by the same AI | Phase 3 |
| Store partner price lists | Excel, POS export or a WhatsApp photo, weekly | Phase 3 |
| Ground team checks | Accuracy on the top 100 staple items | Phase 3 |

**How it is stored.** One master product catalog. Each store's price is a separate record (product, store, branch, price, date, source). Matching is by barcode first, then AI matching on name, brand and size, with a human review queue for uncertain matches.

**Product images.** POS exports have no images. Sources: Open Food Facts (open licence, credited), our own photos of top items, brand partners, user photos, and category icons as a fallback. We do not copy images from other grocery apps.

**Privacy.** Receipts are personal data. Store prices are shared across users; individual spending is never shown to anyone outside the family.

## App prototype scope (Expo)

The prototype shows investors the full vision with real data from the WhatsApp bot, built in React Native with Expo for iOS and Android.

**Screens**

1. **Sign in** with phone number (one-time code).
2. **Home:** typing savings message above the input field, shortcut buttons, this month's spend vs budget, latest receipts.
3. **Instant shop:** product grid and the price card for each product.
4. **Chat shopping assistant:** list by text, voice or photo, budget conversation, confirmation card.
5. **Cart and checkout:** one cart, one order, one delivery.
6. **Scan receipt:** camera capture, then the parsed result to confirm or fix.
7. **Spending history:** charts by week, month, category and store.
8. **Family:** members list, invite by username, each member's spending.
9. **Alerts and memory:** past alerts and what the assistant remembers, with edit and forget.
10. **Settings:** language (English / Arabic, right-to-left layout), budget, notifications.

**Design direction:** modern, smooth and calm. Fluid animations, large readable numbers, full Arabic right-to-left support. Screens are designed first, then built.

Shop, chat shopping, discounts and checkout use sample prices in the prototype and place no real orders; receipts, spending, family and memory read the real database.

## Shopping experience (Phase 3)

There are two ways to shop, and both fill one cart: **Instant shop** for people who know what they want, and **chat with the AI** for people who want help staying within a budget.

&#91;embedded content: Shopping flow · two paths into one cart\]

The chat loops back whenever a basket goes over budget; nothing is ordered until the user taps Approve on the confirmation card.

### Home screen

- **Typing message above the input field**, written out letter by letter as if someone is typing: *"You've saved 500 EGP. How much do you want to save today?"*
  - The number is the user's real total saving to date.
  - New users with nothing saved yet get a starter message instead: *"Let's save your first 100 EGP this month."*
  - Plays once per visit, not every time the user returns to Home. Types right to left in Arabic. Shows instantly with no animation when the phone's reduce-motion setting is on.
- **Input field** in the middle. Tapping it opens the chat shopping assistant.
- **Shortcut buttons under the input field** so users can shop without chatting: **Instant shop**, **Snap my list**, **Reorder last basket**, **My spending**.

### Instant shop

- **Product grid:** one image per product (water, juice, cheese…), not one per store. Category tabs along the top and a search bar.
- Each tile shows the lowest price, e.g. *"from 9 EGP"*, so users don't have to open every item to compare.
- **Price card** opens when a product is tapped:
  - Product image in the center.
  - Below it, a row of small store logos. Each shows that store's price, the % saved, distance from the user and when the price was last updated.
  - The cheapest store is highlighted.
  - A quantity +/– next to each store adds the item to the cart from that store.
  - Closes with the X in the top corner (top right in English, top left in Arabic) or by swiping down. The user then picks the next product the same way.
- **Cart bar** always visible at the bottom: *"6 items · 420 EGP · you save 65 EGP"*.

### Chat shopping assistant

1. The user says what they need: typed, as a voice note, or as a **photo of a handwritten list** (read with the same AI as receipts).
2. They give a budget, or the assistant uses their remaining monthly budget.
3. The assistant looks up real prices from our database and builds the cheapest basket, preferring stores close to each other so it can be delivered in one trip.
4. **If the basket is over budget, it talks it through.** Swaps come first (*"Switch to a cheaper brand of milk and you're within budget"*), then dropping an item or raising the budget. It feels like a helpful friend, not a calculator saying no.
5. Items it can't find or match, it asks about instead of guessing.
6. When everything is agreed, it shows a **confirmation card inside the chat**: each item with its store and quantity, total, total saved, delivery fee, and **Edit** and **Approve** buttons.
7. **The order is placed only when the user taps Approve.** The assistant never orders on its own.

Rules for the assistant: it quotes only prices that exist in our database and never makes one up, and it never places, changes or cancels an order without the user's tap.

### Savings %

- Saving per item is measured against the most expensive current price for that product among stores in the user's area (recommended; to confirm).
- The basket saving shown at checkout is **after** the delivery fee, so the number is always honest.

### One cart

Instant shop and chat fill the same cart. A user can start in chat, add a few items by hand, and check out the same way.

## Combined delivery (Phase 3b)

The customer buys from several stores but gets one order, one payment and one delivery. The stores are pickup points behind the scenes, so it feels like shopping at one store.

**How an order runs**

1. The customer approves one basket and pays us once (card, mobile wallet or cash on delivery).
2. The system splits the basket into one pick list per store.
3. **One shopper** (a motorbike courier) gets a single route: Store B → Store A → customer.
4. The shopper buys everything, pays each store, and delivers one bag.
5. The customer sees one order, one live tracker and one receipt.

**Rules that keep it fast and worth it**

- **Only combine stores close together.** The assistant splits a basket only across stores within a small radius of each other (start at 2 km), so one courier can do it in one trip.
- **At most 2–3 stores per order.**
- **Split only when it pays.** Moving an item to another store happens only when the saving is bigger than the extra delivery cost; otherwise everything stays at one store. The saving shown is always after delivery.
- **Substitutions.** If an item is out of stock, the shopper sends a photo of the alternative. The customer approves it, or the item is refunded automatically.

**How it grows**

1. **Pilot:** our own shoppers in one district, to learn the real cost per order.
2. **Partner stores pre-pack orders** before the shopper arrives, so each pickup takes minutes.
3. **Small hub:** partner stores send stock to a hub, and we pack and deliver from there.

**What changes for us.** With delivery, we are responsible for the order: missing items, refunds and payments. For delivered orders this replaces the earlier note that the shop handles disputes. We need our own refund and substitution policy, plus a store agreement that covers price accuracy and order packing.

## Tech stack and architecture

WhatsApp and the app are two front doors to the same backend and database, so nothing built for the bot is thrown away.

&#91;embedded content: MVP architecture · one backend, two front doors\]

| Layer | Choice | Notes |
| --- | --- | --- |
| WhatsApp gateway | Whapi | MVP only; move to Meta's official Cloud API before scaling |
| Backend | Rust (axum, tokio, sqlx) | Receives Whapi webhooks and app API calls; money handled as exact decimals |
| Hosting | Google Cloud Run, Frankfurt (europe-west3) | One always-on instance so background receipt processing never stalls; same region as Supabase |
| Database, auth, files | Supabase | Postgres, phone sign-in, private receipt and voice-note storage, row-level security |
| Receipt reading | Claude API with structured outputs | Haiku 5.5 vs Sonnet 5.5, picked after a 20-receipt accuracy test |
| Voice notes | Speech-to-text, then Claude | Google Cloud Speech-to-Text (Egyptian Arabic) by default; Claude does not take audio directly |
| Mobile app | React Native + Expo | Smooth animation and styling libraries, Arabic right-to-left |
| Landing page, admin | Vercel | Marketing site and the product-matching review page |

The build pack holds the database schema, the receipt JSON format (every field required, unknown values null, money as numbers in EGP), the receipt prompt and AGENTS.md, the instructions file any AI coding agent reads before building.

## Out of scope, risks and open questions

**Not in the MVP:** wallet or savings account, savings goals, price comparison for live users, store partnerships, flyer reading, café and restaurant suggestions, payments, the medical-tourism idea.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Whapi number banned (unofficial API) | Bot goes offline | Use a spare number, reply-only messaging, start Meta Business verification now |
| Users stop sending receipts | No data, no product | Effortless flow, useful weekly summary, gentle nudges |
| Receipt reading errors on Arabic or faded receipts | Wrong totals, lost trust | Ask for a clearer photo, easy corrections, measure accuracy weekly |
| Product matching is messy | Weak price data | Barcode first, review queue, store-specific name memory |
| Unclear revenue model | Investor objection | Test willingness to pay; explore store and brand partnerships with clearly labelled sponsored deals |
| WhatsApp message costs | Margin pressure | Reply within the 24-hour window, few proactive messages |

**Open questions**

- [x] AI for receipts: Claude via structured outputs; Haiku 5.5 or Sonnet 5.5 decided by the accuracy test.
- [x] Backend language: Rust.
- [ ] Speech-to-text provider for voice notes: confirm Google Cloud Speech-to-Text after testing Egyptian Arabic.
- [ ] How many test families can we recruit in week 1, and from which districts?
- [ ] Who are the investors and when is the meeting?
- [ ] Data protection: what Egypt's personal data law requires for storing receipts.
- [ ] Savings % baseline: the most expensive store in the area (recommended) or the user's usual store?
- [ ] Payment methods at launch of ordering: card, mobile wallet, cash on delivery?
- [ ] Combined delivery pilot: our own couriers or a delivery partner, and which district first?
- [ ] Refund and substitution policy for delivered orders, and the matching store agreement.
