import { Droplets, Egg, Milk, Package, Sandwich, SprayCan, Wheat } from "lucide-react";
import type { Product } from "../data/products";
import { useState } from "react";

const icons = {
  milk: Milk,
  cheese: Package,
  rice: Wheat,
  oil: Droplets,
  eggs: Egg,
  bread: Sandwich,
  tea: Package,
  soap: SprayCan,
};

export function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  const Icon = icons[product.kind];
  const [failed, setFailed] = useState(false);
  return (
    <div className={`product-visual ${product.tone} ${large ? "large" : ""} ${!failed ? "has-photo" : ""}`} aria-hidden="true">
      {!failed ? <img className="product-photo" src={product.image} alt="" loading="lazy" decoding="async" width={640} height={640} onError={() => setFailed(true)} /> : <>
        <span className="product-aura" />
        <Icon size={large ? 64 : 42} strokeWidth={1.45} />
        <span className="product-mark">{product.size.split(" · ")[0]}</span>
      </>}
    </div>
  );
}
