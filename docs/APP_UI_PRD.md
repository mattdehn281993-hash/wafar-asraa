# Wafar Asraa — Mobile App UI PRD

Nov 6, 2026 · @David

This is the design spec for the Wafar Asraa (وفر أسرة) mobile app: every screen, component, state and interaction, in English and Arabic. The WhatsApp assistant has no UI and is covered in the main PRD; both run on the same backend.

## Purpose and scope

This doc tells a designer, or Figma Make, exactly what to build: an iOS and Android app for Egyptian families to track spending, compare prices across stores, shop within a budget and get one delivery.

**In scope:** every app screen, the bottom tab bar, components, motion, empty and error states, Arabic right-to-left layouts, and realistic sample content.

**Not in scope:** the WhatsApp bot (no UI), backend logic, and the database. The main PRD covers those.

**How to use it with Figma Make**

1. Export this doc as Markdown or PDF and attach it to Figma Make, or paste the prompt in the last section.
2. Build in this order: visual direction and components first, then Home, Shop and the price card, Chat, Cart to Order complete, then the rest.
3. Design every screen in **English (left to right) and Arabic (right to left)**, light mode first, dark mode second.
4. Frame size: 390 × 844 (iPhone 14/15). Check that layouts still work at 360 wide (common Android phones in Egypt).

## Design principles

The app should feel like a smart, warm friend who is good with money, not a bank.

1. **Savings are the hero.** Every screen shows what the family saves, in EGP, in a big friendly number. Saving is celebrated; overspending is explained calmly and never shamed.
2. **One tap or one sentence.** Anything can be done by tapping (Instant shop) or by asking (chat). Users never have to fill a form to get value.
3. **Prices you can trust.** Every price shows its store, distance and when it was last updated. The cheapest option is always clearly marked, and sponsored deals are always labelled.
4. **Feels like one store.** Even when a basket comes from three shops, the user sees one cart, one order, one delivery and one receipt.
5. **Made for Egyptian families.** Arabic is a first-class language, not a translation. Prices in EGP, Egyptian dialect in friendly copy, family members shown together.
6. **Calm, not busy.** Generous white space, one main action per screen, motion that guides instead of decorates.

## Visual direction

The look is fresh green for saving, warm amber for deals, plenty of white space and soft rounded shapes. It should sit comfortably next to modern fintech and grocery apps, but feel warmer and more family-like.

### Color tokens

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `primary` | #0F7B5F | #3CC79A | Main buttons, savings numbers, active tab, cheapest-price badge |
| `primary-pressed` | #0B5E49 | #2FA884 | Pressed state of primary buttons |
| `primary-soft` | #E3F4EE | #12342A | Savings chips, selected store row, success backgrounds |
| `accent` | #F2A93B | #F5B95C | Deals, discount badges, "% off" tags (fill only, with dark text) |
| `accent-soft` | #FFF3DF | #3A2B12 | Deal card backgrounds, "expiring soon" strip |
| `danger` | #D64545 | #F07070 | Over budget, errors, remove item |
| `warning` | #E8890C | #F2A33A | Near budget (80%+), substitutions |
| `ink` | #14201B | #EEF3F1 | Main text |
| `ink-muted` | #5B6B65 | #A3B2AC | Secondary text, labels, "updated 2 days ago" |
| `line` | #E4EAE7 | #26322E | Dividers, card borders |
| `surface` | #FFFFFF | #17201D | Cards, sheets, tab bar |
| `background` | #F6F8F7 | #0E1412 | Screen background |

Amber is never used for text on white (contrast too low); it is a fill with `ink` text on it.

### Typography

One font for both languages: **Readex Pro** (Google Fonts), which has matching Arabic and Latin letters, so mixed lines look like one voice.

| Style | Size / line height | Weight | Used for |
| --- | --- | --- | --- |
| Display | 34 / 40 | Bold | The big savings number, order total |
| Title | 24 / 30 | SemiBold | Screen titles |
| Heading | 18 / 24 | SemiBold | Section headings, card titles |
| Body | 16 / 24 | Regular | Main text, chat messages |
| Body small | 14 / 20 | Regular | Store names, item details |
| Caption | 12 / 16 | Medium | Badges, timestamps, "updated" labels |

Prices use tabular (equal-width) figures so columns line up. Arabic text gets 10% more line height.

### Icons, shapes and spacing

- **Icons:** rounded line icons, 24 px, 2 px stroke (Phosphor or Lucide style). The active tab uses the filled version.
- **Corners:** cards 16, product images 12, bottom sheets 24 (top corners), buttons and chips fully rounded (pill).
- **Buttons:** 52 px tall primary buttons, full width at the bottom of a screen; 40 px chips.
- **Spacing:** 4 px grid. 16 px screen padding, 24 px between sections, 12 px inside cards.
- **Shadows:** only on things that float (cart bar, bottom sheets, tab bar); everything else is flat with a 1 px `line` border.

### Imagery

- **Products:** clean photos on a light grey rounded square, centered, no busy backgrounds.
- **Stores:** logo in a 32 px circle; a colored initial if there is no logo.
- **Illustrations:** flat, warm, simple scenes of Egyptian family life (shopping bags, a family table, a piggy bank with a crescent moon for Ramadan). Used for onboarding and empty states only.

### Motion

- **Speeds:** 150 ms for taps, 250 ms for screen changes, 400 ms for celebrations. Bottom sheets use a soft spring.
- **Typing headline (Home):** letters appear one by one at about 35 ms each, with a blinking cursor that fades out when finished.
- **Savings count-up:** numbers roll up from 0 to the real value in 600 ms.
- **Add to cart:** the product image shrinks and flies into the cart bar, the cart count bumps, with a light haptic tap.
- **Reduce motion:** when the phone setting is on, everything appears instantly with simple fades.

## App map

The app has five tabs at the bottom: **Home, Shop, Deals, Spending, Family**. Account opens from the avatar on Home, alerts from the bell, and the chat from the Home input.

&#91;embedded content: App map · 5 tabs, one shared checkout\]

The cart bar floats above the tab bar on every main screen, so shopping from any tab ends in the same cart and checkout.

## Onboarding and sign-in

Getting started takes under two minutes, and every step after sign-in can be skipped. Each step is one question per screen with a progress bar at the top and a full-width button at the bottom.

| # | Screen | What it shows | Notes |
| --- | --- | --- | --- |
| O1 | Splash | Logo animation: a coin drops into a shopping basket, then the name appears | 1 second, no text to read |
| O2 | Language | Two large buttons: **العربية** and **English** | Pre-selects the phone's language; changes layout direction instantly |
| O3 | Welcome (3 slides) | 1. "See where your money goes" (receipt illustration) 2. "Find the cheapest price near you" (price tags) 3. "One cart, one delivery, even from many stores" (one bag) | Swipeable, dots, **Skip** in the top corner |
| O4 | Phone sign-in | +20 country prefix, phone field, **Send code**; then a 6-box code screen with auto-fill and a 30-second resend timer | If the number already uses the WhatsApp assistant: "Welcome back, Mona! Your receipts from WhatsApp are already here." |
| O5 | Name and username | First name; username with a live check (green tick when free, two suggestions when taken) | Helper text: "Your family will add you with this" |
| O6 | Family | "Who shops for your home?" Household size stepper (1–12), then **Invite family now** (share sheet / WhatsApp) or **Later** | Shows small avatar circles filling up as the number grows |
| O7 | Monthly budget | Big EGP number input, quick chips (5,000 / 8,000 / 12,000 / Custom), and **Not sure yet** | "Not sure yet" means the app suggests a budget after the first month |
| O8 | Your area | **Use my location** button, or pick a district from a list (New Cairo, Nasr City, Sheikh Zayed, 6th of October, Maadi, Heliopolis…) | Explains why: "to show stores and prices near you" |
| O9 | WhatsApp | "Send receipts on WhatsApp too" with **Connect WhatsApp** (opens a chat with the assistant) | Skippable |
| O10 | All set | Confetti-light animation, "You're ready to start saving", **Go to Home** | Home then plays its first typing message |

Notification permission is **not** asked during onboarding. It is asked the first time it helps: after the first receipt ("Want a heads-up before you go over budget?").

## Home

Home answers two questions in one glance: how much the family has saved, and what they want to do next. The input field in the middle is the heart of the app.

### Layout, top to bottom

1. **Header.** Avatar on the start side (opens Account), "Good morning, Mona" in small text, bell icon with a dot for unread alerts on the end side.
2. **Typing savings headline.** Two lines at most, written out letter by letter: *"You've saved **500 EGP** this month. How much do you want to save today?"* The amount is in `primary` green, bold. The cursor blinks, then fades when the sentence is done.
3. **The input field.** Large (56 px tall, fully rounded, soft shadow), placeholder *"Tell me what you need, or snap your list…"*, with a camera icon and a microphone icon inside on the end side.
   - Tap the field → Chat opens full screen with the keyboard up.
   - Tap the mic → Chat opens and starts recording a voice message.
   - Tap the camera → list capture opens (photograph a handwritten list).
4. **Shortcut chips** (one row, scrolls sideways): **Instant shop**, **Snap my list**, **Reorder last basket**, **Scan receipt**, **My spending**. Each chip has an icon and a label.
5. **Budget card.** A ring showing the % of the month's budget used, "3,240 of 8,000 EGP spent · 18 days left", and a green chip "Saved 500 EGP". The ring is green under 80%, amber from 80%, red from 100%. Tap → Spending.
6. **Deals for you.** A row of round bubbles, like stories (from your original sketch), one per store or category with fresh deals. A colored ring around a bubble means new deals. Tap → a full-screen deal story for that store, swipe to the next; or **See all** → Deals tab.
7. **Your usual basket.** A card with small images of the items the family buys most often and one button: **Reorder for 1,120 EGP · save 85**.
8. **Weekend picks** (shown Thursday to Saturday only). A card: "3 family dinners under 600 EGP near you" → Weekend picks.
9. **Recent receipts.** The last three, each with store logo, date, total and a small saving chip. Tap → receipt detail.

The **cart bar** floats above the tab bar whenever the cart has items (see Cart). Pull down to refresh.

### Headline variations

The headline always uses the user's real numbers and changes with the situation:

| Situation | English | Arabic |
| --- | --- | --- |
| Normal | You've saved 500 EGP this month. How much do you want to save today? | وفّرت ٥٠٠ جنيه الشهر ده. عايز توفّر كام النهاردة؟ |
| New user | Let's save your first 100 EGP this month. What do you need? | يلا نوفّر أول ١٠٠ جنيه الشهر ده. محتاج إيه؟ |
| Near budget | 82% of your budget is used with 9 days left. Let's find cheaper options. | استخدمت ٨٢٪ من الميزانية وفاضل ٩ أيام. تعال نلاقي بدائل أرخص. |
| Over budget | You're 300 EGP over this month. Here's how to catch up. | عدّيت الميزانية بـ٣٠٠ جنيه. تعال نظبطها سوا. |
| Big win | Your last basket saved 140 EGP! Want to beat it? | آخر مشتريات وفّرت ١٤٠ جنيه! نكسر الرقم ده؟ |

Rules: the animation plays once per app open, not every time the user returns to Home; it types right to left in Arabic; it appears instantly when reduce motion is on.

The wireframe below shows Home and the price card side by side.

&#91;embedded content: Wireframe · Home and the price card (low fidelity)\]

Low-fidelity layout only: Figma Make should apply the colors, type and icons from Visual direction.

## Chat assistant

The chat is a shopping friend: the user says what they need and their budget, and the assistant comes back with the cheapest basket that fits, talks through any problems, and places the order only when the user approves.

### Layout

- **Header:** back arrow, small assistant avatar (a green coin with a smile), title **Wafar assistant**, and a pill showing *"Budget: 1,500 EGP"*. Tapping the pill changes the budget for this chat. A menu holds **New chat** and **Past chats**.
- **Messages** fill the middle. User messages sit on the end side in `primary-soft` bubbles; assistant messages sit on the start side on `surface` with the avatar.
- **Composer** at the bottom: text field, camera button (photo of a list or receipt), microphone (tap to record, tap again to send; a live waveform shows while recording), and send. While the assistant is answering, send turns into **Stop**.

### First open (empty chat)

A short greeting, *"Hi Mona 👋 What are we shopping for?"*, and four suggestion chips:

- *Plan my weekly shopping under 1,500 EGP*
- *Where is my list cheapest?*
- *Snap my handwritten list*
- *How much did we spend on meat this month?*

### Message types to design

| Type | What it looks like |
| --- | --- |
| User text | `primary-soft` bubble, end side, time below |
| User voice note | Bubble with play button, waveform and duration; the transcript appears underneath in small text and can be edited |
| User list photo | Photo thumbnail, then a row of chips with the items the assistant read ("Rice 2kg", "Eggs 30"); tap a chip to fix or remove it |
| Assistant text | `surface` bubble, start side, with avatar |
| Searching | Three-dot typing indicator plus a line *"Checking prices at 6 stores near you…"* with small store logos lighting up one by one |
| Which one? | When an item is unclear ("cheese"), 2–3 mini product cards to tap (white cheese 500g, Roumy 250g, cheddar slices) |
| Basket draft | Items grouped by store: image, name, quantity stepper, price, store logo. A budget bar at the bottom fills toward the budget (green, then amber, then red) |
| Budget fix | See below |
| Confirmation card | See below |
| Order placed | Small card with order number, delivery time and **Track order** |
| Spending answer | Short answer with a mini bar chart by category, and **See details** → Spending |
| Memory saved | Small inline note with a brain icon: *"Saved to memory: birthday this month"*, with **Undo** |

Any price in the chat can be tapped to open its price card, so the user can check the store alternatives.

### When the basket is over budget

The assistant never just says no. It explains the gap and offers fixes, best first:

> *"Your list comes to **1,740 EGP**, which is **240 over** your 1,500 budget. Here's how we can fix it:"*

Then a stack of **fix cards**, each with a toggle and its effect on the total:

1. **Swap:** *Almarai cheese 500g → Domty cheese 500g · −45 EGP* (both product images shown, arrow between)
2. **Swap:** *Basmati rice 5kg → Egyptian rice 5kg · −120 EGP*
3. **Smaller size:** *Sunflower oil 2.2L → 1.5L · −55 EGP*
4. **Drop:** *Chocolate box · −90 EGP*

The budget bar updates live as toggles change. Quick replies under the cards: **Apply best swaps**, **Show other options**, **Raise budget to 1,750**. Swaps always come before dropping items.

### Confirmation card

The final step, shown as one big card in the chat:

- Title: **Your basket is ready**
- Line: *"14 items from 2 stores · 1 delivery"*, with both store logos
- Item list, collapsed to the first 4 with **Show all 14**
- Subtotal, delivery fee, **Total**
- Big green line: **You save 165 EGP** (after delivery)
- Delivery estimate: *"Today, 6–7 pm"*
- Two buttons: **Edit** (opens the cart) and **Approve order** (primary)

**Approve order** opens the payment sheet (see Checkout). The assistant never places, changes or cancels an order without this tap.

### Example conversation

| Who | Message |
| --- | --- |
| User | *\[photo of a handwritten list\]* Budget 1,500 please |
| Assistant | I found 14 items. One question: which cheese do you usually buy? *\[3 cheese cards\]* |
| User | *\[taps Domty white cheese\]* |
| Assistant | Checking prices at 6 stores near you… |
| Assistant | Your list comes to 1,740 EGP, 240 over budget. Here's how we can fix it: *\[fix cards\]* |
| User | *\[taps Apply best swaps\]* |
| Assistant | Done: 1,485 EGP, within budget. *\[confirmation card\]* |
| User | *\[taps Approve order\]* |
| Assistant | Order placed 🎉 One delivery today, 6–7 pm. *\[order card\]* |

## Shop, search and the price card

Instant shop is for people who know what they want: browse, tap a product, pick the store, keep going. No chatting needed.

### Shop screen

1. **Header:** title **Shop**, an area chip *"New Cairo ▾"* (change area), and a search bar *"Search 1,200 products"* with a barcode-scan icon inside.
2. **Category chips** (scroll sideways, each with an icon): All, Dairy & eggs, Vegetables & fruit, Meat & poultry, Bread & bakery, Rice & pasta, Oil & ghee, Drinks & snacks, Cleaning, Personal care, Baby.
3. **Price drops today:** a short sideways row of small tiles, each with a green "↓ 15%" badge.
4. **Sort and filter row:** sort chip (Cheapest / Biggest saving / Popular) and a filter icon. Filters open in a sheet: stores, maximum distance (1, 2, 5 km), deals only, brand.
5. **Product grid,** two columns. Each tile has:
   - One product image (one per product, not per store) on a light grey rounded square
   - Name (up to 2 lines) and size
   - **"from 9.50 EGP"** in green, and *"4 stores"* in small muted text
   - An amber badge **"Save up to 18%"** when stores differ by 5% or more
   - A round **+** button in the corner that adds one unit from the cheapest store straight away (the fast path)

Tapping anywhere else on the tile opens the price card.

### Price card (bottom sheet)

This is your idea, built out. It slides up to about 85% of the screen height.

1. **Top:** drag handle in the center, **X** in the top corner (top right in English, top left in Arabic). Swiping down also closes it.
2. **Product:** large image in the center (160 px), name, size and brand below it, and a small bell **Watch price** toggle (alerts when it gets cheaper).
3. **Store tiles row:** under the product, a row of small tiles, one per store, cheapest first. Each tile shows:
   - Store logo
   - Price, e.g. **9.50 EGP**
   - Saving badge, e.g. **−18%**
   - Distance, e.g. *1.2 km* The cheapest tile has a green border and a **Cheapest** label and is selected when the card opens. Sponsored stores carry a small **Sponsored** label and never jump the order.
4. **Selected store details:** "Al Nour Market · 1.2 km · updated 2 days ago".
5. **Smart delivery hint:** if this store adds a new pickup stop to the order, a small line says *"+1 stop · delivery +10 EGP"*; if it's already in the cart, *"Already in your order · no extra delivery"*. This keeps the real saving honest.
6. **Price history:** a small 30-day line with "Lowest this month: 9.00 EGP".
7. **Bottom:** quantity stepper and a primary button **Add to cart · 9.50 EGP**. After adding, the button turns into a checked stepper *"✓ In cart (2)"* and the product flies to the cart bar. The sheet stays open, so the user can close it and pick the next item, exactly as you described.

Footnote under the store row: *"% saved compared with the highest price nearby."*

### Search

- Before typing: recent searches and popular items as chips.
- Results appear as you type and understand both languages and spelling variants ("jibna", "جبنة", "cheese" all work).
- Barcode scan opens the camera; a scanned product goes straight to its price card.
- No results: *"We don't have prices for that yet. Want us to find it?"* with a **Request it** button.

## Deals and weekend picks

The Deals tab is where discounts live, ranked by what this family actually buys, plus budget-friendly weekend outings.

### Deals tab

- **Header:** title **Deals**, subtitle *"86 deals near you · updated today"*.
- **Segmented control:** **For you** · **All deals** · **Weekend**.
- **Ending soon strip** at the top: small cards with a countdown chip (*"Ends in 2 days"*).
- **Filter chips:** category, store, *Ending soon*, *Bundles*.

**For you** shows deals on the family's usual items and watched items first, with a reason line: *"You buy this every 2 weeks"* or *"You're watching this price"*.

### Deal card

Full-width card on `accent-soft`:

- Product image on the start side
- Product name and size
- Store logo and name, distance
- Old price struck through, new price large: ~~24.00~~ **18.00 EGP**
- Big amber badge **−25%**
- Countdown chip *"Ends Sat"*
- Optional personal line: *"You buy this every 2 weeks"*
- Buttons: **+ Add to cart** and a bookmark icon

**Bundle deals** ("Buy 2, get 1 free") use the same card with a **Bundle** label and show the price per unit after the deal.

Sponsored deals carry a visible **Sponsored** label. They can appear in All deals, but never above a better real deal for the same item, and never in the cheapest-price ranking.

### Deal stories

Opened from the round bubbles on Home. Full screen, one store per story: progress bars at the top, one deal per page with a big image, prices and **Add to cart**, tap the side to go forward or back, swipe down to close.

### Weekend picks

The **Weekend** segment suggests cafés and restaurants that fit the family's budget.

- **Filters:** budget for the outing (Under 300 / 600 / 1,000 EGP), type (Café, Koshary, Grill, Pizza, Seafood, Desserts), *Good for kids*, distance.
- **Pick card:** photo, name, district and distance, *"Family meal for 4 from 480 EGP"*, and a green chip **✓ Fits your weekend budget** when it does.
- **Pick detail:** photo header, a few menu highlights with prices, address with a small map, **Directions** (opens the maps app) and **Call**. No booking in this version.

Watched-price drops also arrive in Alerts and are pinned to the top of For you.

## Cart, checkout, tracking and order complete

From the cart onward the user sees **one store**: one cart, one order, one shopper, one delivery, one receipt, even when the items come from several shops.

### Cart bar (floating)

Appears above the tab bar on every main screen once something is in the cart: *"6 items · 420 EGP · save 65"* and **View cart**. It bumps gently when an item is added.

### Cart screen

1. **Header:** **Your cart**, and a small line *"From 2 nearby stores · 1 delivery"* with the two store logos.
2. **Savings banner** (`primary-soft`): *"You're saving **165 EGP** on this order."*
3. **Make it cheaper** button (sparkle icon). Opens a sheet with the assistant's suggestions:
   - Swaps to cheaper equivalents
   - **Fewer stops:** *"Move 3 items to Al Nour Market to drop one stop: −10 EGP delivery"* Each suggestion has **Apply**.
4. **Items:** one list (not split by store). Each row: image, name and size, a small store logo, price, quantity stepper. Swipe to remove, with **Undo**. If an item is cheaper elsewhere, a small hint line: *"7.50 at Fresh Corner · Switch"*.
5. **Budget meter:** *"This month: 3,240 spent + this order 1,485 = 4,725 of 8,000 EGP"*, shown as a bar with the order's part in a lighter shade.
6. **Summary:** subtotal, delivery fee (with a tap-to-explain: *"1 shopper, 2 stops"*), total, and **Total saved** in green.
7. **Checkout · 1,505 EGP** (primary, fixed at the bottom).

### Checkout

One scrolling screen, in this order:

1. **Delivery address:** saved addresses as cards; **Add address** opens a map pin plus fields for building, floor, apartment and a landmark (*"next to…"*), which Egyptian addresses need.
2. **Delivery time:** slot chips, e.g. *Today 6–7 pm*, *Today 8–9 pm*, *Tomorrow morning*.
3. **If something is out of stock:** **Ask me** (default) / **Pick the closest match** / **Refund it**.
4. **Payment:** Cash on delivery, Card, Mobile wallet. The last used method is pre-selected.
5. **Note for the shopper** (optional).
6. **Order summary** (collapsed), total, total saved.
7. **Place order · 1,505 EGP** (primary).

### Order tracking

- **Status headline:** *"Your shopper is at Al Nour Market (stop 1 of 2)"*.
- **Steps:** Order confirmed → Shopping → On the way → Delivered. The Shopping step expands to show each store with a tick when done, but it stays **one** order with **one** progress line.
- **Map:** the shopper's live position and route, small pins for the pickup stores, a home pin.
- **Shopper card:** photo, first name, **Call** and **Message**.
- **Live checklist:** every item marked picked ✓, replaced ⇄ or missing ✕.
- **Substitution request** (pops up as a card when needed): *"Domty cheese 500g is out of stock at Al Nour. Replace with Juhayna white cheese 500g (+2 EGP)?"* with product images and **Approve** / **Refund it**. A small timer shows how long the shopper will wait.

### Order complete

- **Celebration:** the saving counts up in a big number, *"You saved 165 EGP"*, with a light confetti burst (static when reduce motion is on), and *"This month you've saved 665 EGP"* underneath.
- **One receipt** for the whole order. A **Details by store** section below shows which shop each item came from, for transparency.
- **Rate the delivery** (5 stars, optional comment) and **Report a problem** (missing or wrong item → pick the item → automatic refund or redelivery).

## Spending and receipts

Spending shows where the family's money went this month, from every source: app orders, scanned receipts, WhatsApp receipts and voice notes.

### Spending tab

1. **Month switcher:** *"November 2026"* with arrows on each side.
2. **Family / Me toggle:** the family owner sees everyone's spending; members see their own and the family total.
3. **Hero:** large budget ring with *"4,725 of 8,000 EGP"* in the middle, *"13 days left"*, and a green chip **Saved 665 EGP this month**.
4. **Insights** (sideways cards written by the assistant, one sentence each):
   - *"Snacks are up 30% from last month."*
   - *"Buying rice at Fresh Corner would save about 60 EGP a month."*
   - *"Your Thursday shop is usually the biggest. Plan it in chat?"* Each card has one action button.
5. **By category:** rows with icon, name, a horizontal bar, amount and % of total. Tap → category detail with the items bought and a 6-month trend.
6. **By store:** rows with logo, name, number of visits and total.
7. **Last 6 months:** bar chart of monthly spending with the budget as a line.
8. **Receipts:** list grouped by date. Each row: store logo, store name, total, who bought it (small avatar), and a small source icon (app order, camera, WhatsApp, voice).

A floating **Scan receipt** button sits on the end side, above the cart bar.

### Scan receipt flow

1. **Camera:** a receipt-shaped frame guide and short tips (*"Flat, good light, the whole receipt"*). Captures automatically when the receipt is steady; manual shutter and gallery import also available. Long receipts: **Add another part**.
2. **Reading:** the photo stays on screen while a soft scan line moves down it; items appear in a list underneath one by one. Text: *"Reading your receipt…"*
3. **Check and save:** store, date and total at the top (each editable), then the items with categories. Fields the assistant is unsure about are highlighted amber with *"Check this"*. Buttons: **Looks right · Save** (primary) and **Retake**.
4. **Saved:** a toast *"Saved ✓ Al Nour Market · 412 EGP"*, with any new budget alert shown right after.

If the photo can't be read: a friendly screen with what went wrong (blurry, cut off, too dark), a tip, and **Try again**.

### Receipt detail

Photo thumbnail (tap to zoom), store and branch, date and time, who bought it, items with categories, total and any discounts. **Edit** to fix anything, **Delete** in the menu. Receipts that still need a check show an amber banner at the top.

## Family

The Family tab makes saving a team effort: who is in the family, what each person spends, and one shared shopping list everyone can add to.

1. **Header:** family name (*"Ahmed family"*), number of members, and an **Owner** badge for the owner.
2. **Together hero:** *"Together you saved **665 EGP** this month"*, with member avatars in a row.
3. **Shared shopping list** (new idea): anyone in the family adds what the house needs (*"milk, bread, dish soap"*), each item showing who added it. Buttons: **Shop this list** (sends it to the chat assistant) and **Add to cart**. Items tick off automatically when bought.
4. **Members:** avatar, name, role (Owner / Member), this month's spending, last receipt. Invited people show *"Invited · waiting"* with **Remind**.
5. **Invite** button → sheet with three ways: search by username, enter a phone number, or **Share invite** (WhatsApp link and QR code).
6. **Member detail** (owner view): their spending this month, top categories, recent receipts. Owner actions: **Remove from family**. Member view: **Leave family**.

**Invitation received** (for the invited person): *"Mona invited you to join the Ahmed family on Wafar Asraa"* with the owner's avatar, **Join** and **Decline**. If they're already in another family, the screen explains they need to leave it first.

## Goals, alerts, memory and account

### Savings goals

From your notes: *"help me save 10k in the next 3 months, and congratulate me when I do."* Opened from Account or from a Home insight.

- **Goals list:** each goal as a card with a progress ring, name, *"3,000 of 10,000 EGP"*, and target date. Example goals: *Eid clothes*, *Summer trip*, *School fees*.
- **New goal** (3 short steps): name and emoji → amount → date. The app then shows *"Save about 3,340 EGP a month"* and a **How we'll get there** card with 2–3 concrete ideas from the family's own spending (*"Switch your rice and oil store: \~180 EGP/month"*).
- **Progress:** every saving the app finds is counted toward the active goal, with a small *"+45 EGP to Eid clothes"* toast.
- **Goal reached:** a full-screen celebration, *"Congratulations! You saved 10,000 EGP for Eid clothes 🎉"*, with a share button.

Until the wallet exists, goals **track** savings; the money stays with the family. The goal screen says this in one line.

### Alerts (the bell)

One list grouped by **Today** and **Earlier**, each alert with an icon and one action:

| Alert | Example | Action |
| --- | --- | --- |
| Budget | *"You've used 82% of this month's budget with 9 days left."* | **Tell me why** (opens chat to save a reason) / **See spending** |
| Price drop | *"Domty cheese is 15% cheaper at Fresh Corner."* | **Add to cart** |
| Order | *"Your shopper is on the way."* | **Track** |
| Family | *"Ahmed added a receipt: 230 EGP."* | **View** |
| Weekly summary | *"This week: 1,240 EGP, saved 95."* | **See week** |

If the family already gave a reason for overspending this month, budget alerts stay quiet and the list shows a muted line: *"Quiet: you told us about the birthday."*

### What the assistant remembers

A simple list of notes the assistant has saved, each with an icon, the note in plain words, when it was saved and how long it applies (*"until end of November"*). Swipe to delete, tap to edit. A toggle at the top: **Let the assistant remember things**. One line explains: *"These help me give you better advice. Only your family can see them."*

### Account

- **Profile:** photo, name, username, phone.
- **Preferences:** language (العربية / English), number style (١٢٣ or 123), area, delivery addresses, payment methods.
- **Budget:** monthly budget and optional budgets per category.
- **Notifications:** separate switches for budget alerts, deals, price drops, orders and the weekly summary.
- **WhatsApp:** connected status with the number, and **Open WhatsApp assistant**.
- **Privacy:** **Download my data**, **Delete my account** (with a confirmation step).
- **Help:** FAQs, contact support (WhatsApp), terms, privacy policy, app version.

## Component library

Build these as reusable components with variants before assembling screens. Every component needs an English and an Arabic (mirrored) version, and light and dark.

| Component | Variants and states |
| --- | --- |
| Button | Primary, Secondary (outline), Ghost, Danger · 52 px and 40 px · default, pressed, disabled, loading |
| Chip | Filter (off / on), Shortcut (icon + label), Chat suggestion, Quick reply, Status (green / amber / red) |
| Hero input | Home version with camera and mic icons · idle, focused, recording |
| Text fields | Search (with barcode icon), labelled field with error, money input (EGP), 6-box code input |
| Product tile | Default, with saving badge, in cart (stepper replaces +), out of stock (greyed) |
| Store price tile | Default, selected, cheapest (green border + label), sponsored (label), far away (muted) |
| Price card sheet | Full composition: handle, X, product, store tiles, details, delivery hint, price history, add button |
| Deal card | Standard, bundle, ending soon, sponsored |
| Story bubble | New (colored ring), seen (grey ring) |
| Budget ring | Small (Home card) and large (Spending) · green under 80%, amber 80–99%, red 100%+ |
| Savings badge | Inline chip *"Save 18%"*, banner *"You save 165 EGP"*, count-up number |
| Cart bar | Collapsed (floating) with bump animation |
| Cart item row | Default, cheaper-elsewhere hint, swipe-to-remove |
| Chat bubbles | User text, user voice, user photo, assistant text, typing, searching-stores |
| Chat cards | Which one?, basket draft, fix card (toggle on / off), confirmation, order placed, spending answer, memory saved |
| Tab bar | 5 tabs, active / inactive, badge dot |
| Top bar | Large title, compact with back, with search |
| Bottom sheet | Handle, X, scrollable content, sticky bottom button |
| Toast | Info, success, with Undo |
| Order tracker | Step list with expandable shopping step, map card, shopper card, substitution card |
| Rows | Alert row, receipt row (with source icon), member row, store row, category bar row |
| Goal card | Progress ring, amount, date, emoji |
| Segmented control | 2 and 3 options |
| Stepper | − / count / +, with 0 turning into **Add** |
| Empty state | Illustration, title, one line, one button |
| Skeleton | Tile, row, card, chart placeholders with soft shimmer |

## Empty, loading, error and offline states

Every screen needs these states designed, not left blank. Tone: calm and helpful, one clear next step.

| Where | State | What the user sees |
| --- | --- | --- |
| Any list | Loading | Skeleton shapes of the real layout with a soft shimmer; never a lone spinner on a blank screen |
| Spending | No receipts yet | Illustration of a receipt, *"Your spending will show up here"*, **Scan your first receipt** |
| Cart | Empty | Shopping bag illustration, *"Your cart is empty"*, **Start shopping** and **Ask the assistant** |
| Deals | None nearby | *"No deals near you right now. We'll tell you when there are."* with a notifications switch |
| Family | Alone | *"Saving is easier together"*, **Invite family** |
| Goals | None | *"What are you saving for?"*, **Create a goal** |
| Shop / search | No results | *"We don't have prices for that yet"*, **Request it** |
| Any screen | Offline | A thin banner at the top: *"You're offline. Showing prices from 2 hours ago."* Cart and lists still work; checkout waits |
| Price card | Old price | A muted line *"Price from 9 days ago, may have changed"* when older than 7 days |
| Shop | Area not covered | *"We're not in your area yet"*, **Join the waitlist**, and the area picker |
| Location | Permission denied | Area picker list instead, never a dead end |
| Checkout | Payment failed | Inline message under payment, *"Payment didn't go through. Try again or pick another method."* |
| Checkout | Outside delivery hours | Next available slot pre-selected with a note |
| Chat | Assistant unavailable | Bubble *"I can't check prices right now. Try again in a minute."* with **Retry** |

## Arabic, right-to-left and accessibility

Arabic is designed, not translated. Every screen has an Arabic frame built from the same components.

### Mirror in Arabic

- The whole layout flips: start side is the right. Tab order runs right to left, with **Home** on the far right.
- Back arrows point right; chevrons on list rows point left.
- Close **X** on sheets moves to the top left.
- Swipe actions mirror (swipe right to remove a cart item).
- Progress bars and the budget bar fill from right to left; the budget ring runs counter-clockwise from the top.
- Charts with time run from right (oldest) to left (newest).
- The typing headline types right to left.

### Do not mirror

- Product photos, store logos and illustrations of real objects.
- Phone numbers, order numbers and prices as numbers (*1,250* stays *1,250*, or *١٬٢٥٠*).
- Play buttons, the clock, the camera shutter and check marks.
- Latin brand names inside Arabic sentences keep their own letter order.

### Numbers and currency

- **Number style setting:** Western (123) or Arabic-Indic (١٢٣). Default is Western in both languages, because most store receipts and price tags use it; users can switch in Account.
- **Currency:** *450 EGP* in English, *٤٥٠ جنيه* in Arabic body text, and the short form *ج.م* only in tight spaces like tiles and badges.
- Dates follow the language: *Thu 6 Nov* / *الخميس ٦ نوفمبر*.

### Text length

Labels change length between languages. Let text wrap to two lines in tiles and chips, and never truncate prices or savings.

### Accessibility

- Text contrast at least 4.5:1 (WCAG AA); amber is never used for text on white.
- Touch targets at least 44 × 44.
- Layouts hold up with system text size at 130%.
- Color never carries meaning alone: the cheapest store has a label as well as a green border; over budget has an icon as well as red.
- Screen-reader labels describe the action fully, e.g. *"Add Domty cheese 500 grams from Al Nour Market, 9 pounds 50."*
- Reduce motion and haptics settings are respected everywhere.

## Sample content for the mockups

Use this realistic content so the designs read like the real app. Store names are invented for the prototype; prices are sample figures, not real data.

**Family:** Mona (owner), Ahmed, Youssef. Area: New Cairo. Monthly budget: 8,000 EGP. Spent so far: 3,240 EGP. Saved this month: 500 EGP. Days left: 18.

**Stores:** Al Nour Market (1.2 km), Fresh Corner (1.8 km), Baraka Mart (2.1 km), Masr Hyper (3.4 km).

| Product | Al Nour | Fresh Corner | Baraka | Masr Hyper | Best saving |
| --- | --- | --- | --- | --- | --- |
| Mineral water 1.5 L | **9.50** | 10.00 | 10.75 | 11.50 | 17% |
| Domty white cheese 500 g | **72.00** | 78.00 | 80.00 | 85.00 | 15% |
| Juhayna full cream milk 1 L | **42.00** | 44.00 | 45.00 | 47.00 | 11% |
| Egyptian rice 5 kg | **165.00** | 175.00 | 180.00 | 189.00 | 13% |
| Sunflower oil 1.5 L | **118.00** | 125.00 | 129.00 | 135.00 | 13% |
| Eggs, tray of 30 | 165.00 | **160.00** | 170.00 | 175.00 | 9% |
| Baladi bread, pack of 10 | **15.00** | **15.00** | 16.00 | 18.00 | 17% |
| Loose tea 250 g | **88.00** | 92.00 | 95.00 | 99.00 | 11% |
| Dish soap 1 L | 45.00 | **42.00** | 48.00 | 52.00 | 19% |
| Whole chicken 1.5 kg | 210.00 | **198.00** | 215.00 | 225.00 | 12% |

Prices in EGP; bold is the cheapest. Best saving = cheapest vs the most expensive.

**Deals:** Juhayna milk 1 L ~~47.00~~ **38.00** at Masr Hyper (−19%, ends Sat) · Sunflower oil 1.5 L ~~135.00~~ **105.00** at Baraka Mart (−22%, ends in 2 days) · Dish soap, buy 2 get 1 free at Fresh Corner (bundle).

**Weekend picks:** Bait El Koshary (family meal for 4 from 260 EGP, 1.5 km) · Nile Grill House (from 620 EGP, 2.8 km) · Sukkar Café (desserts for 4 from 340 EGP, 0.9 km).

**Order example:** 14 items from Al Nour Market and Fresh Corner, subtotal 1,465 EGP, delivery 40 EGP, total 1,505 EGP, you save 165 EGP, delivery today 6–7 pm, shopper Karim.

**Goal example:** Eid clothes, 3,000 of 10,000 EGP, by March 2027.

## Prompt for Figma Make

Paste this into Figma Make together with this doc (exported as PDF or Markdown). Build one flow at a time using the order at the end of the prompt.

```
Design a mobile app called Wafar Asraa (وفر أسرة), a money-saving shopping assistant for Egyptian families in Cairo and Giza. Frame 390x844, iOS and Android. Every screen in English (left to right) and Arabic (right to left, mirrored), light mode first.

Look: fresh and warm, like a friend who is good with money. Primary green #0F7B5F, soft green #E3F4EE, amber #F2A93B for deals (fill only, dark text on it), red #D64545 for over budget, text #14201B, muted text #5B6B65, background #F6F8F7, cards white with 1px #E4EAE7 border, corner radius 16 on cards, 24 on bottom sheets, pill-shaped buttons and chips. Font: Readex Pro for Arabic and English. Rounded line icons. Generous white space, one main action per screen.

Bottom tab bar with 5 tabs: Home, Shop, Deals, Spending, Family. A floating cart bar sits above the tab bar when the cart has items: "6 items · 420 EGP · save 65 · View cart".

Home: header with avatar and bell. A large typing headline: "You've saved 500 EGP this month. How much do you want to save today?" (amount in green). Below it a big rounded input "Tell me what you need, or snap your list…" with camera and mic icons. Under the input, a row of shortcut chips: Instant shop, Snap my list, Reorder last basket, Scan receipt, My spending. Then a budget card with a ring (3,240 of 8,000 EGP, 18 days left, saved 500), a row of round story bubbles called "Deals for you", a "Your usual basket" card with a Reorder button, a weekend picks card and recent receipts.

Shop: area chip, search with barcode icon, category chips, "Price drops today" row, 2-column product grid. Each tile: one product image, name, size, "from 9.50 EGP" in green, "4 stores", amber "Save up to 18%" badge, and a round + button. Tapping a tile opens the price card bottom sheet: large product image in the center, then a row of small store tiles (logo, price, -% saving, distance) with the cheapest one highlighted and labelled "Cheapest", selected store details with "updated 2 days ago", a delivery hint "+1 stop · delivery +10 EGP", a 30-day price line, a quantity stepper and "Add to cart · 9.50 EGP". Close with an X in the top corner or swipe down.

Chat assistant (full screen, opened from the Home input): header with assistant avatar and a "Budget: 1,500 EGP" pill. User bubbles in soft green on the end side, assistant bubbles in white on the start side. Design these message types: text, voice note with waveform and transcript, photo of a handwritten list with extracted item chips, "Checking prices at 6 stores near you…" with store logos, "Which one?" product choice cards, a basket draft grouped by store with a budget bar, over-budget fix cards with toggles (swap cheese -45 EGP, swap rice -120 EGP, smaller oil -55 EGP, drop chocolate -90 EGP) and quick replies, and a confirmation card: "Your basket is ready · 14 items from 2 stores · 1 delivery", total 1,505 EGP, "You save 165 EGP", Edit and Approve order buttons.

Deals: segmented For you / All deals / Weekend, ending-soon strip, deal cards on soft amber with old price struck through, new price, big -25% badge, countdown and Add to cart. Weekend tab: restaurant and café cards with "Family meal for 4 from 480 EGP" and a "Fits your weekend budget" chip.

Cart (one list, small store logo per item, savings banner, "Make it cheaper" button, budget meter), Checkout (address with landmark, time slots, out-of-stock preference, Cash on delivery / Card / Mobile wallet, Place order), Order tracking (one progress line, map, shopper card, substitution request card), Order complete (big count-up "You saved 165 EGP" with light confetti, one receipt).

Spending: month switcher, Family/Me toggle, big budget ring, insight cards, category bars, stores, 6-month chart, receipts list, Scan receipt flow (camera frame, reading animation, check and save). Family: together savings, shared shopping list, members, invite sheet. Also: onboarding (language, 3 welcome slides, phone code, name and username, family size, budget, area, WhatsApp), alerts, "What the assistant remembers", savings goals with progress rings, account.

Build order: 1) colors, type and components; 2) Home; 3) Shop and price card; 4) Chat; 5) Cart, checkout, tracking, order complete; 6) Deals; 7) Spending and scan; 8) Family; 9) Onboarding; 10) Goals, alerts, memory, account. Then the Arabic mirrored versions.
```
