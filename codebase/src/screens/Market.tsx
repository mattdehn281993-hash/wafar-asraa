import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowDownUp, PiggyBank, ScanLine, Search, Sparkles, Tag } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useApp } from "../app/AppContext";
import { products, type Product } from "../data/products";
import { productCategory, number, priceAt, lowestStore, highestPrice, campaignProducts } from "../domain/model";
import { AreaSelector } from "../components/AreaSelector";
import { CartButton, DemoNote, EmptyState } from "../components/UI";
import { ProductCard } from "../components/ProductCard";
import { PriceSheet } from "../components/PriceSheet";

export function ShopScreen() {
  const { language, t, availableProducts, area } = useApp(); const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<Product | null>(null); const [category, setCategory] = useState("all"); const [search, setSearch] = useState(""); const [sort, setSort] = useState<"featured" | "price" | "saving">("featured");
  const categories = [["all", t("All", "الكل")], ["dairy", t("Dairy", "ألبان وبيض")], ["pantry", t("Pantry", "أساسيات المطبخ")], ["fresh", t("Fresh", "طازة")], ["home", t("Home", "منظفات")]];
  useEffect(() => { const product = availableProducts.find(p => p.id === params.get("product")); setSelected(product ?? null); }, [params,area.id]);
  const filtered = useMemo(() => {
    const list = availableProducts.filter(p => (category === "all" || productCategory(p.id) === category) && `${p.name} ${p.ar}`.toLowerCase().includes(search.trim().toLowerCase()));
    return sort === "price" ? list.sort((a, b) => priceAt(a,lowestStore(a,area.id),area.id) - priceAt(b,lowestStore(b,area.id),area.id)) : sort === "saving" ? list.sort((a, b) => (highestPrice(b,area.id) - priceAt(b,lowestStore(b,area.id),area.id)) - (highestPrice(a,area.id) - priceAt(a,lowestStore(a,area.id),area.id))) : list;
  }, [category, search, sort, area.id]);
  return <div className="screen"><header className="page-header"><div><AreaSelector /><h1>{t("Shop smart", "تسوّق")}</h1></div><div className="header-tools"><Link className="icon-button" to="/scan" aria-label={t("Scan receipt", "صوّري فاتورة")}><ScanLine size={20} /></Link><CartButton /></div></header><label className="search-field"><Search size={19} /><input value={search} onChange={e => setSearch(e.target.value)} aria-label={t("Search products", "ابحثي عن منتج")} placeholder={t(`Search ${availableProducts.length} sample products`, `ابحثي في ${number(availableProducts.length, language)} منتجات تجريبية`)} /></label><div className="category-row">{categories.map(([id, label]) => <button key={id} type="button" className={category === id ? "active" : ""} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}</div><div className="filter-row"><span>{number(filtered.length, language)} {t("products", "منتجات")}</span><Select label={t("Sort products", "ترتيب المنتجات")} icon={<ArrowDownUp size={14} strokeWidth={2.2} />} value={sort} onChange={setSort} options={[{ value: "featured", label: t("Featured", "المختارة"), icon: <Sparkles size={15} /> }, { value: "price", label: t("Lowest price", "الأقل سعرًا"), icon: <Tag size={15} /> }, { value: "saving", label: t("Biggest saving", "الأكثر توفيرًا"), icon: <PiggyBank size={15} /> }]} /></div>{filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} open={() => setSelected(p)} />)}</div> : <EmptyState title={t("No matching products", "ملقيناش المنتج ده")} body={t("Try a different name or category.", "جرّبي اسم أو قسم تاني.")}><button className="secondary-button" onClick={() => { setSearch(""); setCategory("all"); }}>{t("Clear filters", "امسحي الفلاتر")}</button></EmptyState>}<p className="demo-note">{t(`Sample prices and stock for ${area.en}. Each area keeps its own demo basket.`, `أسعار ومخزون تجريبيين في ${area.ar}. كل منطقة ليها سلتها التجريبية.`)}</p><DemoNote />{selected && <PriceSheet product={selected} close={() => { setSelected(null); if (params.has("product")) setParams({}, { replace: true }); }} />}</div>;
}

export function DealsScreen() {
  const { t, language, watched, area, availableProducts } = useApp();
  const [params] = useSearchParams();
  const campaign = params.get("campaign");
  const campaignNames: Record<string, { en: string; ar: string }> = {
    "fresh-week": { en: "Fresh week", ar: "أسبوع الطازة" }, "pantry-days": { en: "Pantry days", ar: "أساسيات المطبخ" }, "home-refresh": { en: "Home refresh", ar: "جدّدي بيتك" },
  };
  const validCampaign = campaign !== null && Object.hasOwn(campaignProducts,campaign);
  const [segment, setSegment] = useState("foryou");
  const [selected, setSelected] = useState<Product | null>(null);
  useEffect(() => { setSelected(null); }, [area.id, campaign]);
  const scoped = availableProducts.filter(p => !campaign || (validCampaign && campaignProducts[campaign].includes(p.id)));
  const filtered = segment === "watched" ? scoped.filter(p => watched.includes(p.id)) : scoped;
  const items = segment === "biggest" ? [...filtered].sort((a,b) => (highestPrice(b,area.id)-priceAt(b,lowestStore(b,area.id),area.id)) - (highestPrice(a,area.id)-priceAt(a,lowestStore(a,area.id),area.id))).slice(0,4) : filtered;
  return <div className="screen">
    <header className="page-header"><div><AreaSelector /><span className="eyebrow">{number(items.length,language)} {t("sample offers", "عروض تجريبية")}</span><h1>{validCampaign ? campaignNames[campaign][language] : t("Worth saving", "عروض ليكي")}</h1></div><CartButton /></header>
    {campaign && <><p className="demo-note">{t("Illustrative demo campaign. Product cards show the area's sample prices; advertised percentages are mock ad copy.", "حملة توضيحية للتجربة. الكروت بتعرض أسعار المنطقة التجريبية؛ نسب خصم الإعلان للتوضيح بس.")}</p><Link className="text-button" to="/deals">{t("All campaigns", "كل الحملات")}</Link></>}
    <div className="segmented">{[["foryou",t("All offers","كل العروض")],["watched",t("Watching","بتتابعيها")],["biggest",t("Biggest savings","أكبر توفير")]].map(([id,label]) => <button key={id} className={id === segment ? "active" : ""} aria-pressed={id === segment} onClick={() => setSegment(id)}>{label}</button>)}</div>
    {items.length ? <div className="product-grid">{items.map(p => <ProductCard key={p.id} product={p} open={() => setSelected(p)} />)}</div> : <EmptyState title={t("No sample offers for this view", "مفيش عروض تجريبية في الاختيار ده")} body={t("Try another area, campaign or filter.", "جرّبي منطقة أو حملة أو فلتر تاني.")}><Link className="primary-button" to="/shop">{t("Explore products", "شوفي المنتجات")}</Link></EmptyState>}
    <p className="demo-note">{t("Area prices and availability are fictional demo data.", "أسعار المناطق وتوفّر المنتجات بيانات تجريبية، مش حقيقية.")}</p><DemoNote />
    {selected && <PriceSheet product={selected} close={() => setSelected(null)} />}
  </div>;
}
