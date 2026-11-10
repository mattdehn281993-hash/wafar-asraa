import { useState } from "react";
import { useApp } from "../app/AppContext";
import { cairoDate, categoryLabels, parseMoney, type Purchase } from "../domain/model";
import { useErrorToast } from "@/lib/feedback";

export function PurchaseEditor({ purchase, save }: { purchase?: Purchase; save: (purchase: Purchase) => void }) {
  const { t, language, members } = useApp();
  const [store, setStore] = useState(purchase?.store ?? ""); const [date, setDate] = useState(purchase?.date ?? cairoDate());
  const [amount, setAmount] = useState(purchase ? String(purchase.amount / 100) : ""); const [category, setCategory] = useState(purchase?.category ?? "groceries");
  const [member, setMember] = useState(purchase?.memberId ?? "mona"); const [error, setError] = useState("");
  useErrorToast(error);
  return <form className="app-form" onSubmit={e => {
    e.preventDefault(); const total = parseMoney(amount);
    if (!store.trim() || store.trim().length > 80 || total === null || total <= 0 || !date || date > cairoDate() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(new Date(`${date}T12:00:00Z`).getTime())) { setError(t("Enter a store, valid purchase date and positive total with up to two decimal places.", "اكتبي اسم المحل وتاريخ شراء صحيح وإجمالي أكبر من صفر بحد أقصى رقمين عشريين.")); return; }
    save({ id: purchase?.id ?? crypto.randomUUID(), date, memberId: member, store: store.trim(), category, amount: total, saving: purchase?.saving ?? 0, source: purchase?.source ?? "manual" });
  }}><label>{t("Store", "المحل")}<input value={store} onChange={e => setStore(e.target.value)} required maxLength={80} /></label><label>{t("Purchase date", "تاريخ الشراء")}<input type="date" value={date} onChange={e => setDate(e.target.value)} max={cairoDate()} min="1900-01-01" required /></label><label>{t("Total (EGP)", "الإجمالي بالجنيه")}<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required /></label><label>{t("Category", "القسم")}<select value={category} onChange={e => setCategory(e.target.value)}>{Object.entries(categoryLabels).map(([id, label]) => <option key={id} value={id}>{label[language]}</option>)}</select></label><label>{t("Family member", "فرد العيلة")}<select value={member} onChange={e => setMember(e.target.value)}>{members.filter(m => m.status === "active").map(m => <option key={m.id} value={m.id}>{m.id === "mona" ? t("Me", "أنا") : m.name}</option>)}</select></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" type="submit">{t("Save purchase on this device", "احفظي الشراء على الجهاز")}</button></form>;
}
