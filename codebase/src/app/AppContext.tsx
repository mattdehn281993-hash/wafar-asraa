import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { products, type Product } from "../data/products";
import { areas, isAreaId, type AreaId } from "../data/areas";
import { demoMembers, seedPurchases } from "../data/demo";
import { toast } from "@/lib/feedback";
import { budgetDecision, budgetForMonth, cartTotals, changeCart, isAvailable, lowestStore, moveToCheapest, money, monthKey, summarize, type MonthlyBudgets, type CartLine, type ChatMessage, type Language, type Member, type Memory, type Notice, type Purchase } from "../domain/model";

type Theme = "light" | "dark";
type Profile = { name: string; username: string; family: string };
type SavedDemo = { subtotal: number; savings: number; count: number; area: string; slot: string; payment: string };
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
function useStored<T>(key: string, initial: () => T, valid: (v: unknown) => v is T) {
  const [value, setValue] = useState<T>(() => { try { const raw = localStorage.getItem(key); if (raw) { const parsed: unknown = JSON.parse(raw); if (valid(parsed)) return parsed; } } catch { /* Use a valid fallback. */ } return initial(); });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); setStorageError(false); } catch { setStorageError(true); } }, [key, value]);
  return [value, setValue, storageError] as const;
}
const validCart = (v: unknown): v is CartLine[] => Array.isArray(v) && v.length <= 32 && v.every(l => isObject(l) && products.some(p => p.id === l.productId) && Number.isInteger(l.storeId) && Number(l.storeId) >= 0 && Number(l.storeId) <= 3 && Number.isInteger(l.quantity) && Number(l.quantity) >= 1 && Number(l.quantity) <= 99) && new Set(v.map(l => `${l.productId}:${l.storeId}`)).size === v.length;
const validPurchases = (v: unknown): v is Purchase[] => Array.isArray(v) && v.every(p => isObject(p) && typeof p.id === "string" && typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && typeof p.memberId === "string" && typeof p.store === "string" && typeof p.category === "string" && Number.isSafeInteger(p.amount) && Number(p.amount) >= 0 && Number.isSafeInteger(p.saving) && Number(p.saving) >= 0 && ["manual", "sample"].includes(String(p.source)));
const validMembers = (v: unknown): v is Member[] => Array.isArray(v) && v.length > 0 && v.every(m => isObject(m) && typeof m.id === "string" && typeof m.name === "string" && typeof m.username === "string" && ["owner", "member"].includes(String(m.role)) && ["active", "invited"].includes(String(m.status)));
const validNotes = (v: unknown): v is Memory[] => Array.isArray(v) && v.every(n => isObject(n) && typeof n.id === "string" && typeof n.text === "string" && typeof n.month === "string" && typeof n.active === "boolean");
function useStateValue() {
  const month = monthKey();
  const [language, setLanguage, languageError] = useStored<Language>("wafar-language-v2", () => "en", (v): v is Language => v === "en" || v === "ar");
  const [areaId, setAreaId, areaIdError] = useStored<AreaId>("wafar-area-v2", () => { try { const old = localStorage.getItem("wafar-shopping-area"); return isAreaId(old) ? old : "new-cairo"; } catch { return "new-cairo"; } }, isAreaId);
  const [theme, setTheme, themeError] = useStored<Theme>("wafar-theme-v2", () => { try { const old = localStorage.getItem("wafar-theme"); if (old === "light" || old === "dark") return old; } catch { /* system default */ } return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }, (v): v is Theme => v === "light" || v === "dark");
  const [baskets, setBaskets, cartError] = useStored<Record<string, CartLine[]>>("wafar-area-baskets-v3", () => {
    try { const old: unknown = JSON.parse(localStorage.getItem("wafar-cart-v2") ?? "[]"); return validCart(old) ? { [areaId]: old } : {}; } catch { return {}; }
  }, (v): v is Record<string, CartLine[]> => isObject(v) && Object.entries(v).every(([id, lines]) => isAreaId(id) && validCart(lines)));
  const cart = baskets[areaId] ?? [];
  const setCart: Dispatch<SetStateAction<CartLine[]>> = next => setBaskets(all => ({ ...all, [areaId]: typeof next === "function" ? next(all[areaId] ?? []) : next }));
  const [purchases, setPurchases, purchaseError] = useStored<Purchase[]>("wafar-purchases-v2", seedPurchases, validPurchases);
  const [budgets, setBudgets, budgetError] = useStored<MonthlyBudgets>("wafar-monthly-budgets-v3", () => {
    try { const old: unknown = JSON.parse(localStorage.getItem("wafar-budget-v2") ?? "800000"); return { [month]: Number.isSafeInteger(old) && Number(old) >= 0 && Number(old) <= 999999999999 ? Number(old) : 800000 }; } catch { return { [month]: 800000 }; }
  }, (v): v is MonthlyBudgets => isObject(v) && Object.entries(v).every(([key, amount]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(key) && Number.isSafeInteger(amount) && Number(amount) >= 0 && Number(amount) <= 999999999999));
  const budget = budgetForMonth(budgets, month) ?? 0;
  const [profile, setProfile, profileError] = useStored<Profile>("wafar-profile-v2", () => ({ name: "Mona", username: "mona", family: "Ahmed family" }), (v): v is Profile => isObject(v) && [v.name, v.username, v.family].every(x => typeof x === "string" && x.length > 0 && x.length <= 80));
  const [members, setMembers, membersError] = useStored<Member[]>("wafar-members-v2", () => demoMembers, validMembers);
  const [notes, setNotes, notesError] = useStored<Memory[]>("wafar-memory-v2", () => [], validNotes);
  const [messages, setMessages, chatError] = useStored<ChatMessage[]>("wafar-chat-v2", () => [], (v): v is ChatMessage[] => Array.isArray(v) && v.length <= 200 && v.every(m => isObject(m) && typeof m.id === "string" && ["user", "assistant"].includes(String(m.role)) && typeof m.text === "string" && typeof m.time === "string"));
  const [watched, setWatched, watchedError] = useStored<string[]>("wafar-watches-v2", () => [], (v): v is string[] => Array.isArray(v) && v.every(id => products.some(p => p.id === id)));
  const [dismissed, setDismissed, dismissedError] = useStored<string[]>("wafar-notice-read-v2", () => [], (v): v is string[] => Array.isArray(v) && v.every(x => typeof x === "string"));
  const [notifications, setNotifications, notificationsError] = useStored<boolean>("wafar-notifications-v2", () => true, (v): v is boolean => typeof v === "boolean");
  const storageError = languageError || cartError || purchaseError || chatError || areaIdError || themeError || budgetError || profileError || membersError || notesError || watchedError || dismissedError || notificationsError;
  useEffect(() => { if (storageError) toast.error(language === "ar" ? "التغييرات موجودة دلوقتي بس المتصفح مقدرش يحفظها. نزّلي نسخة من بياناتك من الحساب." : "Changes are in memory, but this browser could not save them. Export your data from Account.", { duration: 8000 }); }, [storageError, language]);
  const [lastDemo, setLastDemo] = useState<SavedDemo | null>(null);
  const [status, setStatus] = useState("");
  const t = (en: string, ar: string) => language === "ar" ? ar : en;
  const currency = (amount: number) => money(amount, language);
  const summary = summarize(purchases, month);
  const totals = cartTotals(cart, products, areaId);
  const area = areas.find(a => a.id === areaId) ?? areas[0];
  const availableProducts = products.filter(p => lowestStore(p, areaId) >= 0);
  const unavailableCart = cart.some(line => !isAvailable(line.productId, line.storeId, areaId));
  const activeNotes = notes.filter(n => n.active && n.month >= month);
  const threshold = budgetDecision(summary.spent, budget, activeNotes.some(n => n.month === month));
  const notices: Notice[] = [
    ...(threshold ? [{ id: `${month}-${threshold}`, en: threshold === "budget100" ? "You’ve reached this month’s budget." : "You’ve used 80% of this month’s budget.", ar: threshold === "budget100" ? "وصلتي لميزانية الشهر." : "استخدمتي ٨٠٪ من ميزانية الشهر.", route: "/spending", read: false }] : []),
    { id: `${month}-recap`, en: `You’ve saved ${money(summary.saved, "en")} this month.`, ar: `وفّرتِ ${money(summary.saved, "ar")} الشهر ده.`, route: "/spending", read: false },
    ...watched.map(id => { const p = products.find(p => p.id === id)!; return { id: `watch-${id}`, en: `Watching sample prices for ${p.name}.`, ar: `بتتابعي الأسعار التجريبية لـ${p.ar}.`, route: `/shop?product=${id}`, read: false }; }),
  ].map(n => ({ ...n, read: dismissed.includes(n.id) }));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.lang = language === "ar" ? "ar-EG" : "en";
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101c18" : "#edf3ef");
  }, [theme, language]);
  const addToCart = (product: Product, storeId = lowestStore(product, areaId), quantity = 1) => {
    if (!isAvailable(product.id, storeId, areaId)) { toast.error(t("Not available at this sample store in your area", "مش متاح في المحل التجريبي ده في منطقتك")); return false; }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity + (cart.find(l => l.productId === product.id && l.storeId === storeId)?.quantity ?? 0) > 99) { toast.error(t("Limit: 99 units per product and store. No items were added.", "الحد ٩٩ واحدة لكل منتج في كل محل. مفيش أصناف اتضافت.")); return false; }
    setCart(c => changeCart(c, product.id, storeId, quantity)); const message = t(`${product.name} added to the demo basket.`, `اتضاف ${product.ar} للسلة التجريبية.`); setStatus(message); toast.success(message); return true;
  };
  const savePurchases: typeof setPurchases = next => { setPurchases(next); toast.success(t("Purchase saved on this device", "الشراء اتحفظ على الجهاز")); };
  const saveProfile: typeof setProfile = next => { setProfile(next); toast.success(t("Profile saved", "الملف اتحفظ")); };
  const saveMonthBudget = (selectedMonth: string, amount: number) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth) || !Number.isSafeInteger(amount) || amount < 0 || amount > 999999999999) return;
    setBudgets(all => ({ ...all, [selectedMonth]: amount })); toast.success(t("Budget saved for the selected month", "الميزانية اتحفظت للشهر المختار"));
  };
  const saveBudget = (amount: number) => saveMonthBudget(month, amount);
  const saveNotes: typeof setNotes = next => { setNotes(next); toast.success(t("Memory updated", "الذاكرة اتحدّثت")); };
  const saveMembers: typeof setMembers = next => { setMembers(next); toast.success(t("Demo family updated", "العيلة التجريبية اتحدّثت")); };
  return { language, setLanguage, theme, setTheme, area, setAreaId, cart, addToCart,
    updateQuantity: (id: string, storeId: number, delta: number) => setCart(c => changeCart(c, id, storeId, delta)), clearCart: () => { const previous = cart; setCart([]); toast.success(t("Basket cleared", "السلة اتمسحت"), { action: { label: t("Undo", "تراجعي"), onClick: () => { setCart(previous); return { type: "success", title: t("Basket restored", "السلة رجعت"), action: null }; } } }); },
    makeCheaper: () => { setCart(c => moveToCheapest(c, products, areaId)); toast.success(t("Lowest prices applied up to 99 units per store. Overflow stays at its original stores; all items are kept.", "اختارنا أقل الأسعار لحد ٩٩ واحدة في كل محل. الزيادة فضلت في محلاتها وكل الأصناف موجودة.")); },
    cartCount: totals.count, cartTotal: totals.subtotal, savings: totals.savings, budget, setBudget: saveBudget, budgets, saveMonthBudget, availableProducts, unavailableCart, profile, setProfile: saveProfile,
    purchases, setPurchases: savePurchases, summary, month, members, setMembers: saveMembers, notes, setNotes: saveNotes, activeNotes, messages,
    appendMessages: (next: ChatMessage[]) => setMessages(m => [...m, ...next].slice(-200)), clearChat: () => setMessages([]),
    watched, toggleWatch: (id: string) => { setWatched(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]); toast.success(watched.includes(id) ? t("Price watch removed", "متابعة السعر اتشالت") : t("Watching sample prices", "بنتابع الأسعار التجريبية")); },
    notices, notifications, setNotifications, markRead: (id: string) => setDismissed(ids => [...new Set([...ids, id])]),
    readAll: () => setDismissed(ids => [...new Set([...ids, ...notices.map(n => n.id)])]),
    lastDemo, completeDemo: (slot: string, payment: string) => { if (unavailableCart || !cart.length) return; setLastDemo({ subtotal: totals.subtotal, savings: totals.savings, count: totals.count, area: area[language], slot, payment }); setCart([]); toast.success(t("Demo completed · No order placed", "التجربة خلصت · مفيش طلب حقيقي")); },
    t, currency, status, storageError,
  };
}
const AppContext = createContext<ReturnType<typeof useStateValue> | null>(null);
export function AppProvider({ children }: { children: ReactNode }) { return <AppContext.Provider value={useStateValue()}>{children}</AppContext.Provider>; }
export function useApp() { const value = useContext(AppContext); if (!value) throw new Error("AppProvider missing"); return value; }
