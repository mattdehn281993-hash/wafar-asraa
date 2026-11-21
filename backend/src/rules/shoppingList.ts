// Turns the items Claude read from a shopping-list photo into basket lines.
// Pure: no I/O. Test cases live in fixtures/rules/shopping_list.json.

export const MAX_UNITS_PER_LINE = 99;

export interface ListItem {
  raw_text: string;
  product_id: string | null;
  quantity: number;
}

export interface BasketLine {
  product_id: string;
  quantity: number;
}

export interface ListBasket {
  /** One line per catalogue product, in the order first written. */
  lines: BasketLine[];
  /** What was written for lines with no catalogue match. */
  unmatched: string[];
}

/** Whole units between 1 and 99. Fractions round up: "half a kilo" still means one pack. */
function units(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_UNITS_PER_LINE, Math.max(1, Math.ceil(quantity)));
}

export function listToBasket(
  items: readonly ListItem[],
  catalogueIds: readonly string[],
): ListBasket {
  const known = new Set(catalogueIds);
  const lines: BasketLine[] = [];
  const unmatched: string[] = [];

  for (const item of items) {
    const written = item.raw_text.trim();
    if (!written) continue;
    const id = item.product_id;
    if (id === null || !known.has(id)) {
      unmatched.push(written);
      continue;
    }
    const existing = lines.find((line) => line.product_id === id);
    if (existing)
      existing.quantity = Math.min(MAX_UNITS_PER_LINE, existing.quantity + units(item.quantity));
    else lines.push({ product_id: id, quantity: units(item.quantity) });
  }

  return { lines, unmatched };
}
