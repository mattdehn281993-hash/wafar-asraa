import { useState } from "react";
import { Bell, Check, Plus } from "lucide-react";
import { useApp } from "../app/AppContext";
import { stores, type Product } from "../data/products";
import { number, priceAt, lowestStore, isAvailable } from "../domain/model";
import { ProductVisual } from "./ProductVisual";
import { DemoNote, productSize, Sheet, StoreLogo } from "./UI";

export function PriceSheet({ product, initialStore, close }: { product: Product; initialStore?: number; close: () => void }) {
  const { language, t, currency, addToCart, watched, toggleWatch, area, cart } = useApp();
  const cheapest = lowestStore(product, area.id);
  const [selected, setSelected] = useState(initialStore !== undefined && isAvailable(product.id, initialStore, area.id) ? initialStore : cheapest);
  const [quantity, setQuantity] = useState(1);
  const available = selected >= 0 && isAvailable(product.id, selected, area.id);
  const capacity = 99 - (cart.find(l => l.productId === product.id && l.storeId === selected)?.quantity ?? 0);
  const watching = watched.includes(product.id);
  const price = available ? priceAt(product, selected, area.id) : 0;
  return <Sheet title={language === "ar" ? product.ar : product.name} close={close}>
    <div className="price-product"><ProductVisual product={product} large /><div><span className="eyebrow">{productSize(product, language)}</span><button type="button" className="watch" aria-pressed={watching} onClick={() => toggleWatch(product.id)}>{watching ? <Check size={15} /> : <Bell size={15} />}{watching ? t("Watching sample price", "بتتابعي السعر التجريبي") : t("Watch price", "تابعي السعر")}</button></div></div>
    <p className="demo-note">{t(`Sample availability and prices for ${area.en}`, `أسعار وتوفّر تجريبيين في ${area.ar}`)}</p>
    <div className="store-prices">{stores.map((store, i) => {
      const stocked = isAvailable(product.id, i, area.id);
      return <button type="button" disabled={!stocked} key={store.name} className={selected === i ? "selected" : ""} aria-pressed={selected === i} aria-label={t(`Select ${store.name}`, `اختاري ${store.ar}`)} onClick={() => { setSelected(i); setQuantity(1); }}>
        {stocked && i === cheapest && <span className="cheapest">{t("Lowest sample", "أقل سعر تجريبي")}</span>}<StoreLogo index={i} small /><span>{language === "ar" ? store.ar : store.name}</span><strong>{stocked ? currency(priceAt(product, i, area.id)) : t("Unavailable", "مش متاح")}</strong><small>{t("Sample store", "محل تجريبي")}</small>
      </button>;
    })}</div>
    <p className="comparison-note">{t("Demo only. Savings compare with the highest sample price. Limit: 99 units per product/store, including items already in your basket.", "للتجربة بس. التوفير مقارنة بأعلى سعر تجريبي. الحد ٩٩ واحدة لكل منتج في كل محل، شامل الموجود في السلة.")}</p>
    <div className="price-quantity"><span>{t("Quantity", "الكمية")}</span><div className="stepper"><button aria-label={t("Decrease quantity", "قللي الكمية")} onClick={() => setQuantity(q => Math.max(1,q-1))} disabled={quantity === 1}>−</button><span>{number(quantity,language)}</span><button aria-label={t("Increase quantity", "زوّدي الكمية")} onClick={() => setQuantity(q => Math.min(capacity,q+1))} disabled={quantity >= capacity}>+</button></div></div>
    {capacity === 0 && <p className="form-error">{t("This product has reached the store quantity limit.", "المنتج وصل للحد الأقصى في المحل ده.")}</p>}
    <button className="primary-button" disabled={!available || capacity < quantity} onClick={() => { if (addToCart(product, selected, quantity)) close(); }}><Plus size={18} />{t("Add to cart", "ضيفي للسلة")} · {currency(price * quantity)}</button><DemoNote />
  </Sheet>;
}