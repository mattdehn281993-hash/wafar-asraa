import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useApp } from "../app/AppContext";
import { products } from "../data/products";
import { toast } from "@/lib/feedback";
import { readShoppingList, type ListReadError } from "@/lib/listReader";
import { BackHeader, DemoNote } from "../components/UI";
import { HomeComposer } from "../components/HomeComposer";
import { ProductVisual } from "../components/ProductVisual";
import { lowestStore, number, parseMoney, priceAt, proposalTotal, proposeFromList, summarize, type ProposedLine } from "../domain/model";

type Incoming = { draft: string; attachment?: { url: string; name: string } | null };
type Proposal = { source: "list" | "chat"; lines: ProposedLine[]; unmatched: string[] };

const aliases: Record<string, string[]> = { milk: ["milk", "لبن", "حليب"], rice: ["rice", "رز", "أرز"], cheese: ["cheese", "جبنة", "جبنه"], oil: ["oil", "زيت"], eggs: ["eggs", "بيض"], bread: ["bread", "عيش"], tea: ["tea", "شاي"], soap: ["soap", "صابون", "مواعين"] };
const catalogue = products.map(p => ({ id: p.id, name: p.name, name_ar: p.ar }));

export function ChatScreen() {
  const { t, language, messages, appendMessages, clearChat, summary, purchases, budget, month, currency, cart, cartTotal, cartCount, savings, addToCart, activeNotes, setNotes, availableProducts, area } = useApp();
  const location = useLocation(); const navigate = useNavigate();
  const handled = useRef<string | null>(null); const end = useRef<HTMLDivElement>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [added, setAdded] = useState(false);
  const [photo, setPhoto] = useState<{ id: string; url: string; receipt: boolean } | null>(null);
  const [reading, setReading] = useState(false);
  // The area and an abort signal are read when a slow AI answer arrives, so keep them in refs.
  const areaRef = useRef(area); areaRef.current = area;
  const aborter = useRef<AbortController | null>(null);
  useEffect(() => () => aborter.current?.abort(), []);

  const now = () => new Date().toISOString();
  const reply = (text: string) => appendMessages([{ id: crypto.randomUUID(), role: "assistant", text, time: now() }]);
  const product = (id: string) => products.find(p => p.id === id)!;
  const productName = (id: string) => language === "ar" ? product(id).ar : product(id).name;
  const join = (items: string[]) => items.join(language === "ar" ? "، " : ", ");

  const readErrors: Record<ListReadError, string> = {
    not_configured: t("Reading list photos needs the AI connection, which isn’t set up on this server yet.", "قراءة صور القوائم محتاجة اتصال الذكاء الاصطناعي، ولسه مش متظبط على السيرفر ده."),
    offline: t("I couldn’t reach the Wafar server. Check that it’s running, then try again.", "مقدرتش أوصل لسيرفر وفّر. اتأكدي إنه شغال وجرّبي تاني."),
    rate_limited: t("That’s a lot of photos in a short time. Wait a few minutes, then try again.", "صور كتير في وقت قصير. استني كام دقيقة وجرّبي تاني."),
    unreadable: t("I couldn’t read this photo. Try a clearer, well-lit photo of the list.", "مقدرتش أقرا الصورة دي. جرّبي صورة أوضح للقائمة في نور كويس."),
    failed: t("Something went wrong while reading the list. Please try again.", "حصلت مشكلة وأنا بقرا القائمة. جرّبي تاني."),
  };

  async function readList(url: string) {
    aborter.current?.abort();
    const controller = new AbortController(); aborter.current = controller;
    setReading(true);
    const result = await readShoppingList(url, catalogue, controller.signal);
    if (controller.signal.aborted) return;
    setReading(false);
    if (!result.ok) { reply(readErrors[result.error]); return; }

    const { kind, items, issues, basket } = result.reading;
    if (kind === "receipt") {
      setPhoto(p => p && { ...p, receipt: true });
      reply(t("This looks like a receipt, not a shopping list. You can enter its purchase on the receipt screen.", "دي شكلها فاتورة مش قائمة مشتريات. تقدري تدخلي الشراء في شاشة الفاتورة."));
      return;
    }
    if (kind !== "shopping_list" || !items.length) {
      reply(t("I couldn’t find a shopping list in this photo. Try a photo where the whole list is clear.", "ملقيتش قائمة مشتريات في الصورة دي. جرّبي صورة القائمة فيها واضحة كلها."));
      return;
    }

    const shoppingArea = areaRef.current;
    const { proposed, notInArea } = proposeFromList(basket.lines, products, shoppingArea.id);
    const unmatched = [...basket.unmatched, ...notInArea.map(productName)];
    setProposal({ source: "list", lines: proposed, unmatched }); setAdded(false);

    const total = proposalTotal(proposed, products, shoppingArea.id);
    const read = t(`I read ${items.length} ${items.length === 1 ? "item" : "items"} from your list.`, `قريت ${number(items.length, language)} من القائمة.`);
    const found = proposed.length
      ? t(`${proposed.length} ${proposed.length === 1 ? "is" : "are"} in the sample catalogue: ${currency(total)} at the lowest sample prices in ${shoppingArea.en}.`, `${number(proposed.length, language)} منهم في الكتالوج التجريبي: ${currency(total)} بأقل الأسعار التجريبية في ${shoppingArea.ar}.`)
      : t("None of them are in the sample catalogue yet.", "ولا واحد منهم في الكتالوج التجريبي لسه.");
    const missing = unmatched.length ? t(`Not in the sample catalogue: ${join(unmatched)}.`, `مش في الكتالوج التجريبي: ${join(unmatched)}.`) : "";
    const unclear = issues.length ? t("Part of the photo was hard to read, so check the items.", "جزء من الصورة مكانش واضح، فراجعي الأصناف.") : "";
    const next = proposed.length ? t("Review the basket below and approve it to add it to your cart. Nothing is ordered.", "راجعي السلة تحت ووافقي عليها عشان تتضاف للسلة. مفيش حاجة بتتطلب.") : "";
    reply([read, found, missing, unclear, next].filter(Boolean).join(" "));
  }

  function send(input: Incoming) {
    const text = input.draft.trim(); if (!text && !input.attachment) return;
    setProposal(null); setAdded(false);
    const id = crypto.randomUUID(); const time = now(); const lower = text.toLowerCase();

    if (input.attachment) {
      setPhoto({ id, url: input.attachment.url, receipt: false });
      appendMessages([{ id, role: "user", text: text || t("Photo of my shopping list", "صورة قائمة المشتريات"), time }]);
      void readList(input.attachment.url);
      return;
    }

    let response: string;
    if (/^(remember|افتكري|احفظي)\s+/i.test(text)) { const note = text.replace(/^(remember|افتكري|احفظي)\s+/i, "").trim(); setNotes(all => [...all, { id: crypto.randomUUID(), text: note.slice(0, 500), month, active: true }]); response = t(`I’ll remember this month: ${note}`, `هفتكر الشهر ده: ${note}`); }
    else if (/remember|memory|فاكر|ذاكرة/.test(lower)) response = activeNotes.length ? activeNotes.map((n, i) => `${i + 1}. ${n.text}`).join("\n") : t("No active notes. You can add a reason on Updates & memory.", "مفيش ملاحظات حالية. تقدري تضيفي سبب من التحديثات والذاكرة.");
    else if (/spend|spent|صرف|مصاريف/.test(lower)) {
      const meat = /meat|لحوم|لحمة/.test(lower); const amount = meat ? summarize(purchases.filter(p => p.category === "meat"), month).spent : summary.spent;
      response = t(`This month: ${currency(amount)} ${meat ? "on meat and poultry" : "spent by your family"}. Monthly budget: ${currency(budget)}. Includes sample and manually entered purchases.`, `الشهر ده: ${currency(amount)} ${meat ? "على اللحوم والدواجن" : "مصاريف العيلة"}. ميزانية الشهر: ${currency(budget)}. شامل الأمثلة والمشتريات اليدوية.`);
    } else {
      const ids = availableProducts.filter(p => aliases[p.id].some(alias => lower.includes(alias))).map(p => p.id);
      const planning = /weekly|plan|budget|basket|cheapest|list|أسبوع|ميزانية|سلة|قائمة|أوفر/.test(lower);
      const selection = (ids.length ? ids : planning ? ["milk", "rice", "cheese", "eggs", "bread"] : []).filter(id => availableProducts.some(p => p.id === id));
      if (selection.length) {
        const lines = selection.map(id => ({ id, quantity: 1 }));
        setProposal({ source: "chat", lines, unmatched: [] });
        const total = proposalTotal(lines, products, area.id);
        const entered = lower.replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).match(/\d[\d,٬]*(?:\.\d{1,2})?/);
        const cap = entered ? (parseMoney(entered[0]) ?? 0) : Math.max(0, budget - summary.spent);
        response = t(`Sample basket: ${currency(total)} for ${selection.length} products, one unit each. ${total > cap ? "It exceeds the stated or remaining budget; remove an item or adjust your budget before adding it." : "It fits the stated or remaining budget."} Review the sample products below; nothing is ordered.`, `سلة تجريبية: ${currency(total)} لـ${number(selection.length, language)} منتجات، واحدة من كل صنف. ${total > cap ? "أعلى من الميزانية المحددة أو الباقية؛ شيلي صنف أو عدّلي الميزانية قبل الإضافة." : "جوه الميزانية المحددة أو الباقية."} راجعي المنتجات تحت؛ مفيش حاجة بتتطلب.`);
      } else response = t("I can show your saved spending, prepare a sample basket for products in this catalogue, or read a photo of your shopping list. Try ‘How much did we spend?’, name a few products, or send a photo of your list.", "أقدر أعرض مصاريفك المحفوظة، أو أجهز سلة تجريبية من المنتجات الموجودة، أو أقرا صورة قائمة مشترياتك. جرّبي «مصاريف الشهر كام؟» أو اكتبي أسامي منتجات أو ابعتي صورة القائمة.");
    }
    appendMessages([{ id, role: "user", text, time }, { id: crypto.randomUUID(), role: "assistant", text: response, time }]);
  }

  function approve() {
    if (!proposal) return;
    const overflow = proposal.lines.some(line => {
      const p = product(line.id); const store = lowestStore(p, area.id);
      return (cart.find(l => l.productId === line.id && l.storeId === store)?.quantity ?? 0) + line.quantity > 99;
    });
    if (overflow) { toast.error(t("Some products would go over the 99-unit store limit. No items were added.", "فيه منتجات هتعدّي حد ٩٩ واحدة في المحل. مفيش أصناف اتضافت.")); return; }
    proposal.lines.forEach(line => addToCart(product(line.id), lowestStore(product(line.id), area.id), line.quantity));
    setAdded(true);
  }

  useEffect(() => { setProposal(null); setAdded(false); }, [area.id]);
  useEffect(() => {
    const incoming = location.state as Incoming | null;
    if (incoming && handled.current !== location.key) { handled.current = location.key; send(incoming); navigate("/chat", { replace: true, state: null }); }
  }, [location.key]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length, reading, proposal]);

  const proposalSum = proposal ? proposalTotal(proposal.lines, products, area.id) : 0;
  const time = (iso: string) => new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-EG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" }).format(new Date(iso));

  return <div className="screen sub-screen chat-screen">
    <BackHeader title={t("Wafar assistant", "مساعد وفّر")} trailing={<button className="text-button" onClick={() => { aborter.current?.abort(); setReading(false); clearChat(); setProposal(null); setPhoto(null); }}>{t("Clear chat", "امسحي المحادثة")}</button>} />
    <p className="chat-demo-note">{t("Demo assistant · Shopping-list photos are read by AI; prices and stores are samples", "مساعد تجريبي · صور القوائم بيقراها الذكاء الاصطناعي؛ الأسعار والمحلات تجريبية")}</p>
    <div className="messages">
      {!messages.length && <div className="message assistant"><p>{t("What does your home need today? Send a photo of your shopping list and I’ll find the lowest sample prices.", "البيت محتاج إيه النهارده؟ ابعتي صورة قائمة مشترياتك وأنا أدورلك على أقل الأسعار التجريبية.")}</p></div>}
      {messages.map(m => <div className={`message ${m.role}`} key={m.id}>
        {photo?.id === m.id && <img className="chat-attachment" src={photo.url} alt={t("Attached photo", "الصورة المرفقة")} />}
        <p>{m.text}</p>
        <small>{time(m.time)}</small>
      </div>)}
      {reading && <div className="message assistant chat-reading" role="status"><span className="chat-reading-dots" aria-hidden="true"><i /><i /><i /></span><p>{t("Reading your list and checking sample prices…", "بقرا قائمتك وبشوف الأسعار التجريبية…")}</p></div>}
      <div className="suggestions">{[t("Plan my weekly basket", "جهزي سلة الأسبوع"), t("How much did we spend this month?", "مصاريف الشهر كام؟"), t("What do you remember?", "فاكرة إيه؟")].map(text => <button key={text} onClick={() => send({ draft: text })}>{text}</button>)}</div>
      {proposal && (proposal.lines.length > 0 || proposal.unmatched.length > 0) && <section className="chat-basket" aria-labelledby="chat-basket-title">
        <h3 id="chat-basket-title">{proposal.source === "list" ? t("Your list at the lowest sample prices", "قائمتك بأقل الأسعار التجريبية") : t("Proposed sample basket", "سلة تجريبية مقترحة")}</h3>
        {proposal.lines.length > 0 && <div className="suggested-products">{proposal.lines.map(line => { const p = product(line.id); const unit = priceAt(p, lowestStore(p, area.id), area.id); return <div key={line.id}>
          <ProductVisual product={p} />
          <span>{productName(line.id)}{line.quantity > 1 && <em className="chat-basket-qty"> × {number(line.quantity, language)}</em>}</span>
          <strong>{currency(unit * line.quantity)}</strong>
          <button className="text-button" disabled={added} onClick={() => setProposal(prev => prev && { ...prev, lines: prev.lines.filter(x => x.id !== line.id) })}>{t("Remove", "شيلي")}</button>
        </div>; })}</div>}
        {proposal.unmatched.length > 0 && <div className="chat-unmatched"><small>{t("Not in the sample catalogue", "مش في الكتالوج التجريبي")}</small><ul>{proposal.unmatched.map((text, i) => <li key={`${text}-${i}`}>{text}</li>)}</ul></div>}
        {proposal.lines.length > 0 && <>
          <p>{currency(proposalSum)}</p>
          <button className="primary-button" disabled={added} onClick={approve}>{added ? t("Added to cart", "اتضافت للسلة") : proposal.source === "list" ? t("Approve and add to cart", "وافقي وضيفي للسلة") : t("Add proposed items to cart", "ضيفي الأصناف المقترحة للسلة")}</button>
        </>}
      </section>}
      {cart.length > 0 && <Link className="secondary-button chat-cart-link" to="/cart">{t("Review cart", "راجعي السلة")} · {number(cartCount, language)} · {currency(cartTotal)} · {t("Save", "توفير")} {currency(savings)}</Link>}
      {photo?.receipt && <Link className="text-button" to="/scan" state={{ attachment: { url: photo.url, name: t("Chat photo", "صورة المحادثة") } }}>{t("Enter purchase from this photo", "دخلي الشراء من الصورة دي")}</Link>}
      <DemoNote local />
      <div ref={end} />
    </div>
    <HomeComposer onSend={send} />
  </div>;
}
