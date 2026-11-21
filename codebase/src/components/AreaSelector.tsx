import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { useApp } from "../app/AppContext";
import { areas, cities } from "../data/areas";

export function AreaSelector() {
  const { language, area, setAreaId } = useApp();
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) { dialog.current?.showModal(); search.current?.focus(); }
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  const matches = areas.filter(item => {
    const city = cities.find(city => city.id === item.city)!;
    return `${item.en} ${item.ar} ${city.en} ${city.ar}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  });
  return <>
    <button type="button" className="area-trigger eyebrow" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setQuery(""); setOpen(true); }} aria-label={ar ? `اختاري منطقة التسوّق، ${area.ar}` : `Choose shopping area, ${area.en}`}><MapPin size={13} /><span>{area[language]}</span><ChevronDown size={13} /></button>
    <dialog ref={dialog} className="area-dialog" dir={ar ? "rtl" : "ltr"} aria-labelledby="area-title" aria-describedby="area-description" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="area-panel">
        <div className="sheet-handle" aria-hidden="true" />
        <header className="area-heading"><div><span className="eyebrow">{ar ? "قريب من بيتك" : "Around your home"}</span><h2 id="area-title">{ar ? "بتتسوّقي فين؟" : "Where do you shop?"}</h2></div><button type="button" className="icon-button" aria-label={ar ? "اقفلي المناطق" : "Close areas"} onClick={() => setOpen(false)}><X size={18} /></button></header>
        <p id="area-description" className="area-description">{ar ? "اختاري منطقتك في القاهرة أو الجيزة." : "Choose your area in Cairo or Giza."}</p>
        <label className="search-field area-search"><Search size={18} /><input ref={search} value={query} onChange={event => setQuery(event.target.value)} aria-label={ar ? "ابحثي عن مدينة أو منطقة" : "Search city or area"} placeholder={ar ? "مدينة أو منطقة…" : "Search city or area…"} /></label>
        <div className="area-options">{cities.map(city => {
          const options = matches.filter(item => item.city === city.id);
          return options.length > 0 && <section key={city.id} aria-label={city[language]}><h3>{city[language]}</h3><div role="group" aria-label={city[language]}>{options.map(item => <button type="button" key={item.id} className={`area-option ${item.id === area.id ? "selected" : ""}`} aria-pressed={item.id === area.id} onClick={() => { setAreaId(item.id); setOpen(false); }}><MapPin size={16} /><span>{item[language]}</span>{item.id === area.id && <Check size={17} />}</button>)}</div></section>;
        })}{matches.length === 0 && <p className="area-empty" role="status">{ar ? "ملقيناش المنطقة دي. جرّبي اسم تاني." : "No matching areas. Try another name."}</p>}</div>
        <p className="area-demo">{ar ? "اختيار منطقة للتجربة · الأسعار المعروضة أمثلة" : "Demo shopping area · Prices shown are samples"}</p>
      </div>
    </dialog>
  </>;
}
