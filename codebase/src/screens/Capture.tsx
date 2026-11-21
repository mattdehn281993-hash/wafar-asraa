import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Camera, ImagePlus, ReceiptText, X } from "lucide-react";
import { useApp } from "../app/AppContext";
import { BackHeader, DemoNote } from "../components/UI";
import { PurchaseEditor } from "../components/PurchaseEditor";
import { toast, useErrorToast } from "@/lib/feedback";

export function ScanScreen() {
  const { t, setPurchases } = useApp(); const location = useLocation(); const navigate = useNavigate(); const input = useRef<HTMLInputElement>(null); const upload = useRef<HTMLInputElement>(null);
  const incoming = location.state as { attachment?: { url: string; name: string } } | null;
  const [image, setImage] = useState(incoming?.attachment ?? null); const [error, setError] = useState("");
  useErrorToast(error);
  function attach(file?: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || file.size > 10 * 1024 * 1024) { setError(t("Choose a photo smaller than 10 MB.", "اختاري صورة أقل من ١٠ ميجا.")); return; }
    const reader = new FileReader(); reader.onload = () => { setImage({ url: String(reader.result), name: file.name }); setError(""); toast.success(t("Photo attached for this session", "الصورة اتضافت للجلسة")); }; reader.onerror = () => setError(t("Could not open the photo. Try another.", "الصورة مفتحتش. جرّبي واحدة تانية.")); reader.readAsDataURL(file);
  }
  return <div className="screen sub-screen capture-screen"><BackHeader title={t("Receipt or purchase", "فاتورة أو شراء")} /><p className="demo-note">{t("Automatic receipt reading needs the backend connection. Capture a photo for reference and enter the details below. Photos stay in this session and are not uploaded or saved.", "قراءة الفواتير التلقائية محتاجة توصيل الباك إند. صوّري الفاتورة للرجوع ليها ودخلي التفاصيل تحت. الصور بتفضل في الجلسة دي ومش بتترفع أو تتحفظ.")}</p>{image ? <div className="receipt-reference"><img src={image.url} alt={t("Receipt reference", "صورة الفاتورة")} /><button className="icon-button" aria-label={t("Remove photo", "امسحي الصورة")} onClick={() => setImage(null)}><X size={18} /></button></div> : <div className="capture-empty"><ReceiptText size={38} /><span>{t("Photo optional · Details entered manually", "الصورة اختيارية · التفاصيل بتتكتب يدوي")}</span></div>}<div className="capture-actions"><button className="secondary-button" onClick={() => input.current?.click()}><Camera size={18} />{t("Take photo", "صوّري")}</button><button className="secondary-button" onClick={() => upload.current?.click()}><ImagePlus size={18} />{t("Choose photo", "اختاري صورة")}</button></div><input ref={input} type="file" hidden accept="image/*" capture="environment" onChange={e => { attach(e.target.files?.[0]); e.target.value = ""; }} /><input ref={upload} type="file" hidden accept="image/*" onChange={e => { attach(e.target.files?.[0]); e.target.value = ""; }} />{error && <p className="form-error" role="alert">{error}</p>}<PurchaseEditor save={purchase => { setPurchases(all => [...all, purchase]); navigate("/spending", { replace: true }); }} /><DemoNote local /></div>;
}
