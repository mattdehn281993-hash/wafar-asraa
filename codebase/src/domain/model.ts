// All monetary calculations use integer piastres. This module has no UI or network dependencies.
export type Language = "en" | "ar";
export type CartLine = { productId: string; storeId: number; quantity: number };
export type Purchase = { id: string; date: string; memberId: string; store: string; category: string; amount: number; saving: number; source: "sample" | "manual" };
export type Member = { id: string; name: string; username: string; role: "owner" | "member"; status: "active" | "invited" };
export type Memory = { id: string; text: string; month: string; active: boolean };
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; time: string };
export type Notice = { id: string; en: string; ar: string; route: string; read: boolean };
export type PriceProduct = { id: string; price: number; high: number };
export const categoryLabels: Record<string, { en: string; ar: string }> = {
  groceries: { en: "Groceries", ar: "بقالة" }, dairy: { en: "Dairy & eggs", ar: "ألبان وبيض" }, pantry: { en: "Pantry", ar: "أساسيات المطبخ" }, fresh: { en: "Bread & fresh food", ar: "عيش وأكل طازة" }, home: { en: "Home & cleaning", ar: "منظفات البيت" }, meat: { en: "Meat & poultry", ar: "لحوم ودواجن" }, snacks: { en: "Snacks & drinks", ar: "سناكس ومشروبات" }, other: { en: "Other", ar: "أخرى" },
};
export function productCategory(id: string) { return ["milk", "cheese", "eggs"].includes(id) ? "dairy" : id === "soap" ? "home" : id === "bread" ? "fresh" : "pantry"; }
// Explicit fictional area fixtures. Prices are integer piastre adjustments.
export const sampleAreas: Record<string, { offsets: number[]; missing: string[]; closedStore: number | null }> = {
  'new-cairo': { offsets: [0, 0, 0, 0], missing: [], closedStore: null },
  'nasr-city': { offsets: [-100, -300, 100, 0], missing: ['soap'], closedStore: 3 },
  maadi: { offsets: [300, -500, 100, 200], missing: ['eggs', 'tea'], closedStore: 2 },
  heliopolis: { offsets: [200, 0, -400, 100], missing: ['bread'], closedStore: 1 },
  mokattam: { offsets: [-200, 200, 0, 300], missing: ['cheese', 'soap'], closedStore: 3 },
  'sheikh-zayed': { offsets: [400, -400, 100, 200], missing: ['tea'], closedStore: 0 },
  '6-october': { offsets: [-300, 100, -200, 0], missing: ['eggs'], closedStore: 2 },
  dokki: { offsets: [0, -200, 200, 100], missing: ['rice'], closedStore: 3 },
  mohandessin: { offsets: [100, 200, -300, 0], missing: ['bread', 'tea'], closedStore: 1 },
  haram: { offsets: [-400, -100, 0, 200], missing: ['cheese'], closedStore: 2 },
};
export function isAvailable(productId: string, storeId: number, areaId = 'new-cairo') {
  const fixture = sampleAreas[areaId];
  return !!fixture && storeId >= 0 && storeId < 4 && Number.isInteger(storeId) && !fixture.missing.includes(productId) && fixture.closedStore !== storeId;
}
export function priceAt(product: PriceProduct, storeId: number, areaId = 'new-cairo') {
  if (!Number.isInteger(storeId) || storeId < 0 || storeId > 3) throw new Error("Invalid store");
  return product.price * 100 + Math.round(((product.high - product.price) * 100 * storeId) / 3) + (sampleAreas[areaId]?.offsets[storeId] ?? 0);
}
export function lowestStore(product: PriceProduct, areaId = 'new-cairo') {
  return [0, 1, 2, 3].filter(i => isAvailable(product.id, i, areaId)).sort((a,b) => priceAt(product,a,areaId) - priceAt(product,b,areaId))[0] ?? -1;
}
export function highestPrice(product: PriceProduct, areaId = 'new-cairo') { return Math.max(...[0,1,2,3].map(i => priceAt(product,i,areaId))); }
export function cartTotals(cart: CartLine[], products: PriceProduct[], areaId = 'new-cairo') {
  return cart.reduce((sum, line) => {
    const product = products.find(p => p.id === line.productId);
    if (!product) return sum;
    const unitPrice = priceAt(product, line.storeId, areaId);
    return { count: sum.count + line.quantity, subtotal: sum.subtotal + unitPrice * line.quantity, savings: sum.savings + (highestPrice(product, areaId) - unitPrice) * line.quantity };
  }, { count: 0, subtotal: 0, savings: 0 });
}
export function changeCart(cart: CartLine[], productId: string, storeId: number, delta: number): CartLine[] {
  if (!Number.isInteger(delta) || !Number.isInteger(storeId) || storeId < 0 || storeId > 3) return cart;
  const old = cart.find(line => line.productId === productId && line.storeId === storeId);
  const requested = (old?.quantity ?? 0) + delta;
  if (requested > 99) return cart; // Reject the entire addition; never silently truncate it.
  const quantity = Math.max(0, requested);
  return [...cart.filter(line => line !== old), ...(quantity ? [{ productId, storeId, quantity }] : [])];
}
/** Fill the cheapest store up to 99; leave overflow at its original stores. */
export function moveToCheapest(cart: CartLine[], products: PriceProduct[], areaId = 'new-cairo') {
  const result: CartLine[] = [];
  for (const productId of new Set(cart.map(l => l.productId))) {
    const lines = cart.filter(l => l.productId === productId);
    const product = products.find(p => p.id === productId);
    const cheapest = product ? lowestStore(product, areaId) : -1;
    if (cheapest < 0) { result.push(...lines); continue; }
    let quantity = lines.find(l => l.storeId === cheapest)?.quantity ?? 0;
    const remaining: CartLine[] = [];
    for (const line of lines.filter(l => l.storeId !== cheapest)) {
      const moved = Math.min(99 - quantity, line.quantity);
      quantity += moved;
      if (line.quantity > moved) remaining.push({ ...line, quantity: line.quantity - moved });
    }
    if (quantity) result.push({ productId, storeId: cheapest, quantity });
    result.push(...remaining);
  }
  return result;
}
export type MonthlyBudgets = Record<string, number>;
export function budgetForMonth(budgets: MonthlyBudgets, month: string): number | null { return Object.hasOwn(budgets, month) ? budgets[month] : null; }
export const campaignProducts: Record<string, string[]> = { 'fresh-week': ['bread', 'eggs', 'milk'], 'pantry-days': ['rice', 'oil', 'tea'], 'home-refresh': ['soap'] };
export function cairoDate(now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
export function monthKey(now = new Date()) { return cairoDate(now).slice(0, 7); }
export function monthOptions(now = new Date()) {
  const [year, month] = monthKey(now).split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => { const d = new Date(Date.UTC(year, month - 1 - i, 1)); return d.toISOString().slice(0, 7); });
}
export function daysLeft(month: string, now = new Date()) {
  if (month !== monthKey(now)) return 0;
  const [year, number, day] = cairoDate(now).split("-").map(Number);
  return new Date(Date.UTC(year, number, 0)).getUTCDate() - day;
}
export function summarize(purchases: Purchase[], month: string, memberId?: string) {
  const selected = purchases.filter(p => p.date.startsWith(month) && (!memberId || p.memberId === memberId));
  return { purchases: selected, spent: selected.reduce((s, p) => s + p.amount, 0), saved: selected.reduce((s, p) => s + p.saving, 0), categories: Object.entries(selected.reduce<Record<string, number>>((s, p) => { s[p.category] = (s[p.category] ?? 0) + p.amount; return s; }, {})).sort((a, b) => b[1] - a[1]) };
}
export function budgetDecision(spent: number, budget: number, reason: boolean): "budget80" | "budget100" | null {
  if (budget <= 0 || reason) return null;
  return spent >= budget ? "budget100" : spent * 100 >= budget * 80 ? "budget80" : null;
}
export function parseMoney(value: string): number | null {
  const normalized = value.replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[٬,\s]/g, "").replace("٫", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result <= 999999999999 ? result : null;
}
export function money(piastres: number, language: Language) {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", { minimumFractionDigits: piastres % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(piastres / 100) + (language === "ar" ? " جنيه" : " EGP");
}
export function number(value: number, language: Language) { return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG").format(value); }
export function dateLabel(date: string, language: Language, monthOnly = false) { return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-EG", { timeZone: "Africa/Cairo", ...(monthOnly ? { month: "long", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" }) }).format(new Date(`${date}${date.length === 7 ? "-01" : ""}T12:00:00Z`)); }
export type ProposedLine = { id: string; quantity: number };
/** Shopping-list lines → products sold in this area (bought at their cheapest sample store) and products not sold here. */
export function proposeFromList(lines: { product_id: string; quantity: number }[], products: PriceProduct[], areaId = 'new-cairo') {
  const proposed: ProposedLine[] = []; const notInArea: string[] = [];
  for (const line of lines) {
    const product = products.find(p => p.id === line.product_id);
    if (!product) continue;
    if (lowestStore(product, areaId) < 0) notInArea.push(product.id);
    else proposed.push({ id: product.id, quantity: Math.min(99, Math.max(1, Math.trunc(line.quantity))) });
  }
  return { proposed, notInArea };
}
/** Total of a proposal at each product's cheapest sample store in this area, in piastres. */
export function proposalTotal(lines: ProposedLine[], products: PriceProduct[], areaId = 'new-cairo') {
  return lines.reduce((sum, line) => {
    const product = products.find(p => p.id === line.id); if (!product) return sum;
    const store = lowestStore(product, areaId);
    return store < 0 ? sum : sum + priceAt(product, store, areaId) * line.quantity;
  }, 0);
}
