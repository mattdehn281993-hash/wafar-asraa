import { useEffect, useId, useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ShoppingBag, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useApp } from "../app/AppContext";
import { stores, type Product } from "../data/products";
import { number } from "../domain/model";

export function CartButton() {
  const { cartCount, t } = useApp();
  return <Link className="icon-button home-cart" to="/cart" aria-label={t(`Open cart, ${cartCount} items`, `السلة، ${cartCount} أصناف`)}><ShoppingBag size={19} />{cartCount > 0 && <span>{cartCount}</span>}</Link>;
}
export function BackHeader({ title, trailing }: { title: string; trailing?: ReactNode }) {
  const navigate = useNavigate(); const { language, t } = useApp();
  const Back = language === "ar" ? ArrowRight : ArrowLeft;
  return <header className="compact-header"><button className="icon-button" onClick={() => { if (window.history.state?.idx > 0) navigate(-1); else navigate("/"); }} aria-label={t("Go back", "ارجعي")}><Back size={22} /></button><h1>{title}</h1><div className="header-trailing">{trailing}</div></header>;
}
export function Sheet({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const heading = useId(); const { t, language } = useApp();
  const closing = useRef(close); closing.current = close;
  useEffect(() => { const element = dialog.current!; const before = document.body.style.overflow; element.showModal(); document.body.style.overflow = "hidden"; return () => { element.close(); document.body.style.overflow = before; }; }, []);
  return <dialog ref={dialog} className="area-dialog app-sheet" dir={language === "ar" ? "rtl" : "ltr"} aria-labelledby={heading} onCancel={() => closing.current()} onClick={e => { if (e.target === e.currentTarget) closing.current(); }}><div className="area-panel"><div className="sheet-handle" aria-hidden="true" /><header className="area-heading"><h2 id={heading}>{title}</h2><button type="button" className="icon-button" onClick={close} aria-label={t("Close", "اقفلي")}><X size={18} /></button></header>{children}</div></dialog>;
}
export function DemoNote({ local = false }: { local?: boolean }) { const { t } = useApp(); return <p className="demo-note">{local ? t("Saved on this device · Not synced to an account", "محفوظ على الجهاز ده · مش متزامن مع حساب") : t("Demo preview · Sample prices and spending · No real orders", "نسخة تجريبية · أسعار ومصاريف أمثلة · مفيش طلبات حقيقية")}</p>; }
export function EmptyState({ title, body, children }: { title: string; body: string; children?: ReactNode }) { return <div className="empty-state"><ShoppingBag size={32} /><h2>{title}</h2><p>{body}</p>{children}</div>; }
export function StoreLogo({ index = 0, small = false }: { index?: number; small?: boolean }) { const store = stores[index]; return <span className={`store-logo ${small ? "small" : ""}`} style={{ background: store.color }} aria-hidden="true">{store.letter}</span>; }
export function productSize(product: Product, language: string) {
  const ar: Record<string, string> = { milk: "جهينة · ١ لتر", cheese: "دومتي · ٥٠٠ جرام", rice: "٥ كيلو", oil: "١٫٥ لتر", eggs: "طبق ٣٠ بيضة", bread: "كيس ١٠ أرغفة", tea: "٢٥٠ جرام", soap: "فريش · ١ لتر" };
  return language === "ar" ? ar[product.id] : product.size;
}
export function BudgetRing({ spent, budget }: { spent: number; budget: number }) {
  const { currency, t, language } = useApp(); const percent = budget > 0 ? Math.round(spent * 100 / budget) : 0;
  return <div className="budget-ring large dynamic-ring" role="img" aria-label={t(budget > 0 ? `${percent}% of family budget used` : "No recorded budget", budget > 0 ? `استخدمتي ${percent}٪ من ميزانية العيلة` : "مفيش ميزانية محفوظة")} style={{ background: `conic-gradient(var(--primary) ${Math.min(100, percent)}%, var(--control) 0)` }}><div><strong>{budget > 0 ? `${number(percent, language)}%` : "—"}</strong><span>{budget > 0 ? currency(budget) : t("No budget", "مفيش ميزانية")}</span></div></div>;
}
