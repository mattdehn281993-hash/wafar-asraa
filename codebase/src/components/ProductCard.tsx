import { Plus } from "lucide-react";
import { useApp } from "../app/AppContext";
import type { Product } from "../data/products";
import { ProductVisual } from "./ProductVisual";
import { stores } from "../data/products";
import { number, priceAt, lowestStore, highestPrice, isAvailable } from "../domain/model";
import { productSize } from "./UI";

export function ProductCard({ product, open, storeId: preferredStore }: { product: Product; open: () => void; storeId?: number }) {
  const { language, currency, area } = useApp();
  const ar = language === "ar";
  const storeId = preferredStore !== undefined && isAvailable(product.id, preferredStore, area.id) ? preferredStore : lowestStore(product, area.id);
  if (storeId < 0) return null;
  const price = priceAt(product, storeId, area.id);
  const saving = Math.round((highestPrice(product, area.id) - price) * 100 / highestPrice(product, area.id));
  return <article className="product-card">
    <button className="product-main" onClick={open} aria-label={ar ? `قارني أسعار ${product.ar}` : `Compare prices for ${product.name}`}>
      <ProductVisual product={product} />
      {saving > 0 && <span className="discount-badge">−{number(saving, language)}%</span>}
      <h3>{ar ? product.ar : product.name}</h3><small>{productSize(product, language)}</small>
      <strong>{currency(price)}</strong>
      <span className="store-count">{ar ? stores[storeId].ar : stores[storeId].name}</span>
    </button>
    <button type="button" className="add-button" onClick={event => { event.stopPropagation(); open(); }} aria-label={ar ? `اختاري محل لـ${product.ar}` : `Choose store for ${product.name}`}><Plus size={19} /></button>
  </article>;
}
