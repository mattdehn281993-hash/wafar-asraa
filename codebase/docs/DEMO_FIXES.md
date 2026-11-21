# Demo consistency fixes

All five changes run locally. No retailer feed, account service or ordering connection was added.

1. **Cart quantities:** limit 99 units per product/store. An overflowing addition is rejected in full. Moving to the cheapest available sample store fills it to 99 and leaves excess at original stores. No units disappear. The price sheet accounts for units already in the basket and explains the limit.
2. **Chat proposals:** a new message clears the previous proposal before answering. A new basket request creates a fresh proposal from products available in the selected area. Changing areas also clears it. Once added, a proposal cannot be edited and resubmitted accidentally; edits belong in the cart.
3. **Monthly budgets:** `wafar-monthly-budgets-v3` stores a separate integer-piastre value for each month. The old single budget migrates into the current month only. Historical months without a record show an explicit message and no misleading percentage. Zero means explicitly unset. Account → Monthly family budget includes a month selector; editing one month preserves others. New months start without an invented budget.
4. **Ads:** three Arabic sibling creatives are selected in Arabic mode. Each image links to its own campaign query: `fresh-week`, `pantry-days`, or `home-refresh`. The Deals page filters the campaign, then the area's stock and selected watch/savings filter. Empty combinations explain that no sample offers match. The advertised percentages are illustrative mock artwork, not guaranteed discounts on every catalogue item.
5. **Areas:** explicit fictional fixtures for all ten Cairo/Giza areas define per-store price adjustments, unavailable products and unavailable stores. Home, Shop, Deals, comparison sheets, chat suggestions and basket totals use them. Baskets are saved separately by area in `wafar-area-baskets-v3`; switching back restores the basket. The legacy basket migrates into the selected area. Existing unavailable lines remain visible for correction and block demo checkout until corrected.

The original English banners remain intact. Arabic image prompts and provenance are in `src/assets/promos/README.md`. All promotional copy stays within the images, with no captions or bordered wrapper on Home.

## Verification

- `npm test`: domain regression tests for overflow, no-loss cheapest-store moves, budget isolation, area prices/stock and campaign membership, plus existing calculations.
- `npm run build`: TypeScript and Vite production build.
- Browser: compare Sheikh Zayed/Maadi catalogue prices and counts, check disabled unavailable stores, switch areas and restore a saved basket, choose a historical month without a budget, ask a spending question after a basket proposal, switch ads to Arabic and open their campaign page.

Rust and SQL migrations are unchanged; this is the React investor demo. Shopping, promotions, availability, price comparisons and checkout remain fictional demo behavior.
