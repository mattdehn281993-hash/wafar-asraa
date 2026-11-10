import { useState } from "react";
import { ArrowRight, ReceiptText, ShoppingBag } from "lucide-react";
import { Link } from "react-router";
import { useApp } from "../app/AppContext";
import { products } from "../data/products";
import { HomeComposer } from "../components/HomeComposer";
import { HomePromos } from "../components/HomePromos";
import { ProductCard } from "../components/ProductCard";
import { PriceSheet } from "../components/PriceSheet";
import { ThemeToggle } from "../components/ThemeToggle";
import { CartButton, DemoNote } from "../components/UI";

export function HomeScreen() {
  const { language, setLanguage, profile, t, notices, notifications, availableProducts } = useApp();
  const [selected, setSelected] = useState<{ index: number; storeId: number } | null>(null);
  const notice = notifications ? notices.find(n => !n.read) : undefined;
  const offers = [0, 3, 1, 7, 2, 4, 5, 6].filter(index => availableProducts.some(p => p.id === products[index].id)).slice(0,4);
  return <div className="screen home-screen home-focused"><header className="home-header"><Link className="avatar" to="/account" aria-label={t("Open account", "افتحي حسابك")}>{profile.name[0]}</Link><div><small>{t("A little help for your home", "مساعدة بسيطة لبيتك")}</small><strong>{t(`Hello, ${profile.name}`, `أهلاً يا ${profile.name}`)}</strong></div><ThemeToggle /><button className="language-pill" onClick={() => setLanguage(language === "en" ? "ar" : "en")} aria-label={t("Switch to Arabic", "التبديل للإنجليزي")}>{t("عربي", "EN")}</button><CartButton /></header><section className="home-conversation" aria-label={t("Your household assistant", "مساعدك لاحتياجات البيت")}><HomePromos /><HomeComposer intro={{ id: notice?.id ?? "caught-up", message: `${notice ? notice[language] : t("You’re all caught up.", "شفتي كل التحديثات.")} ${t("What shall we save on today?", "تحبي نوفّر في إيه النهارده؟")}` }} /><div className="home-quick-actions"><Link to="/shop"><ShoppingBag size={16} />{t("Instant shop", "تسوّق سريع")}<ArrowRight size={14} /></Link><Link to="/spending"><ReceiptText size={16} />{t("My spending", "مصروفاتي")}</Link></div></section><section className="home-offers" aria-labelledby="home-offers-title"><div className="section-heading"><div><h2 id="home-offers-title">{t("Everyday favorites, for less", "حاجات بتحبيها، بسعر أقل")}</h2><p>{t("A few sample finds from different stores", "اختيارات تجريبية من محلات مختلفة")}</p></div><Link to="/deals">{t("View all", "الكل")}<ArrowRight size={14} /></Link></div><div className="product-grid">{offers.map((index, i) => <ProductCard key={products[index].id} product={products[index]} storeId={i % 3} open={() => setSelected({ index, storeId: i % 3 })} />)}</div><DemoNote /></section>{selected && <PriceSheet product={products[selected.index]} initialStore={selected.storeId} close={() => setSelected(null)} />}</div>;
}
