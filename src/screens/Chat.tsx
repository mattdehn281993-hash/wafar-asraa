import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useApp } from "../app/AppContext";
import { products } from "../data/products";
import { toast } from "@/lib/feedback";
import { BackHeader, DemoNote } from "../components/UI";
import { HomeComposer } from "../components/HomeComposer";
import { ProductVisual } from "../components/ProductVisual";
import { number, parseMoney, priceAt, summarize, lowestStore } from "../domain/model";

type Incoming = { draft: string; attachment?: { url: string; name: string } | null };
const aliases: Record<string, string[]> = { milk: ["milk", "لبن", "حليب"], rice: ["rice", "رز", "أرز"], cheese: ["cheese", "جبنة", "جبنه"], oil: ["oil", "زيت"], eggs: ["eggs", "بيض"], bread: ["bread", "عيش"], tea: ["tea", "شاي"], soap: ["soap", "صابون", "مواعين"] };
export function ChatScreen() {
  const { t, language, messages, appendMessages, clearChat, summary, purchases, budget, month, currency, cart, cartTotal, cartCount, savings, addToCart, activeNotes, setNotes, availableProducts, area } = useApp();
  const location = useLocation(); const navigate = useNavigate(); const handled = useRef<string | null>(null); const end = useRef<HTMLDivElement>(null);
  const [suggested, setSuggested] = useState<string[]>([]); const [photo, setPhoto] = useState<{ id: string; url: string } | null>(null); const [added, setAdded] = useState(false);
  function send(input: Incoming) {
    const text = input.draft.trim(); if (!text && !input.attachment) return;
    setSuggested([]); setAdded(false);
    const id = crypto.randomUUID(); const time = new Date().toISOString(); const lower = text.toLowerCase();
    let response: string;
    if (input.attachment) { setPhoto({ id, url: input.attachment.url }); response = t("Photo received in this session. AI image reading isn’t connected yet. You can enter its purchase details on the receipt screen.", "الصورة موجودة في الجلسة دي. قراءة الصور بالذكاء الاصطناعي لسه مش متوصلة. تقدري تدخلي تفاصيل الشراء في شاشة الفاتورة."); }
    else if (/^(remember|افتكري|احفظي)\s+/i.test(text)) { const note = text.replace(/^(remember|افتكري|احفظي)\s+/i, "").trim(); setNotes(all => [...all, { id: crypto.randomUUID(), text: note.slice(0, 500), month, active: true }]); response = t(`I’ll remember this month: ${note}`, `هفتكر الشهر ده: ${note}`); }
    else if (/remember|memory|فاكر|ذاكرة/.test(lower)) response = activeNotes.length ? activeNotes.map((n, i) => `${i + 1}. ${n.text}`).join("\n") : t("No active notes. You can add a reason on Updates & memory.", "مفيش ملاحظات حالية. تقدري تضيفي سبب من التحديثات والذاكرة.");
    else if (/spend|spent|صرف|مصاريف/.test(lower)) {
      const meat = /meat|لحوم|لحمة/.test(lower); const amount = meat ? summarize(purchases.filter(p => p.category === "meat"), month).spent : summary.spent;
      response = t(`This month: ${currency(amount)} ${meat ? "on meat and poultry" : "spent by your family"}. Monthly budget: ${currency(budget)}. Includes sample and manually entered purchases.`, `الشهر ده: ${currency(amount)} ${meat ? "على اللحوم والدواجن" : "مصاريف العيلة"}. ميزانية الشهر: ${currency(budget)}. شامل الأمثلة والمشتريات اليدوية.`);
    } else {
      const ids = availableProducts.filter(p => aliases[p.id].some(alias => lower.includes(alias))).map(p => p.id);
      const planning = /weekly|plan|budget|basket|cheapest|list|أسبوع|ميزانية|سلة|قائمة|أوفر/.test(lower);
      const selection = (ids.length ? ids : planning ? ["milk", "rice", "cheese", "eggs", "bread"] : []).filter(id => availableProducts.some(p => p.id === id));
      if (selection.length) {
        setSuggested(selection); setAdded(false); const total = selection.reduce((sum, id) => sum + priceAt(products.find(p => p.id === id)!, lowestStore(products.find(p => p.id === id)!, area.id), area.id), 0);
        const entered = lower.replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).match(/\d[\d,٬]*(?:\.\d{1,2})?/);
        const cap = entered ? (parseMoney(entered[0]) ?? 0) : Math.max(0, budget - summary.spent);
        response = t(`Sample basket: ${currency(total)} for ${selection.length} products, one unit each. ${total > cap ? "It exceeds the stated or remaining budget; remove an item or adjust your budget before adding it." : "It fits the stated or remaining budget."} Review the sample products below; nothing is ordered.`, `سلة تجريبية: ${currency(total)} لـ${number(selection.length, language)} منتجات، واحدة من كل صنف. ${total > cap ? "أعلى من الميزانية المحددة أو الباقية؛ شيلي صنف أو عدّلي الميزانية قبل الإضافة." : "جوه الميزانية المحددة أو الباقية."} راجعي المنتجات تحت؛ مفيش حاجة بتتطلب.`);
      } else response = t("I can show your saved spending or prepare a sample basket for products in this catalogue. Free-form AI isn’t connected yet. Try ‘How much did we spend?’ or name a few products.", "أقدر أعرض مصاريفك المحفوظة أو أجهز سلة تجريبية من المنتجات الموجودة. الذكاء الاصطناعي لسه مش متوصل. جرّبي «مصاريف الشهر كام؟» أو اكتبي أسامي منتجات.");
    }
    appendMessages([{ id, role: "user", text: text || t("Photo attached (session only)", "صورة مرفقة (للجلسة دي بس)"), time }, { id: crypto.randomUUID(), role: "assistant", text: response, time }]);
  }
  useEffect(() => { setSuggested([]); setAdded(false); }, [area.id]);
  useEffect(() => {
    const incoming = location.state as Incoming | null;
    if (incoming && handled.current !== location.key) { handled.current = location.key; send(incoming); navigate("/chat", { replace: true, state: null }); }
  }, [location.key]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);
  return <div className="screen sub-screen chat-screen"><BackHeader title={t("Wafar assistant", "مساعد وفّر")} trailing={<button className="text-button" onClick={() => { clearChat(); setSuggested([]); setPhoto(null); }}>{t("Clear chat", "امسحي المحادثة")}</button>} /><p className="chat-demo-note">{t("Local demo assistant · Free-form AI and voice transcription are not connected", "مساعد تجريبي محلي · الذكاء الاصطناعي وتحويل الصوت لسه مش متوصلين")}</p><div className="messages">{!messages.length && <div className="message assistant"><p>{t("What does your home need today?", "البيت محتاج إيه النهارده؟")}</p></div>}{messages.map(m => <div className={`message ${m.role}`} key={m.id}>{photo?.id === m.id && <img className="chat-attachment" src={photo.url} alt={t("Attached photo", "الصورة المرفقة")} />}<p>{m.text}</p><small>{new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-EG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(m.time))}</small></div>)}<div className="suggestions">{[t("Plan my weekly basket", "جهزي سلة الأسبوع"), t("How much did we spend this month?", "مصاريف الشهر كام؟"), t("What do you remember?", "فاكرة إيه؟")].map(text => <button key={text} onClick={() => send({ draft: text })}>{text}</button>)}</div>{suggested.length > 0 && <section className="chat-basket"><h3>{t("Proposed sample basket", "سلة تجريبية مقترحة")}</h3><div className="suggested-products">{suggested.map(id => { const p = products.find(p => p.id === id)!; return <div key={id}><ProductVisual product={p} /><span>{language === "ar" ? p.ar : p.name}</span><strong>{currency(priceAt(p, lowestStore(p,area.id), area.id))}</strong><button className="text-button" disabled={added} onClick={() => setSuggested(list => list.filter(x => x !== id))}>{t("Remove", "شيلي")}</button></div>; })}</div><p>{currency(suggested.reduce((sum, id) => sum + priceAt(products.find(p => p.id === id)!, lowestStore(products.find(p => p.id === id)!, area.id), area.id), 0))}</p><button className="primary-button" disabled={added} onClick={() => { const canAdd = suggested.every(id => { const p = products.find(p => p.id === id)!; return (cart.find(l => l.productId === id && l.storeId === lowestStore(p,area.id))?.quantity ?? 0) < 99; }); if (!canAdd) { toast.error(t("Some products reached the 99-unit store limit. No items were added.", "فيه منتجات وصلت لحد ٩٩ واحدة في المحل. مفيش أصناف اتضافت.")); return; } suggested.forEach(id => addToCart(products.find(p => p.id === id)!)); setAdded(true); }}>{added ? t("Added to cart", "اتضافت للسلة") : t("Add proposed items to cart", "ضيفي الأصناف المقترحة للسلة")}</button></section>}{cart.length > 0 && <Link className="secondary-button chat-cart-link" to="/cart">{t("View cart", "شوفي السلة")} · {number(cartCount, language)} · {currency(cartTotal)} · {t("Save", "توفير")} {currency(savings)}</Link>}{photo && <Link className="text-button" to="/scan" state={{ attachment: { url: photo.url, name: t("Chat photo", "صورة المحادثة") } }}>{t("Enter purchase from this photo", "دخلي الشراء من الصورة دي")}</Link>}<DemoNote local /><div ref={end} /></div><HomeComposer onSend={send} /></div>;
}
