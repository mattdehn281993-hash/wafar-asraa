import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Camera, ImagePlus, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../app/AppContext";
import { toast, useErrorToast } from "@/lib/feedback";

export function HomeComposer({ onSend, intro }: { intro?: { id: string; message: string }; onSend?: (message: { draft: string; attachment: { url: string; name: string } | null }) => void } = {}) {
  const { language } = useApp();
  const ar = language === "ar";
  const navigate = useNavigate();
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState("");
  useErrorToast(error);
  const [interrupted, setInterrupted] = useState(false);
  const [introText, setIntroText] = useState("");
  const [introPhase, setIntroPhase] = useState<"typing" | "hold" | "fade" | "idle">("idle");
  useEffect(() => {
    if (!intro || interrupted) { setIntroPhase("idle"); return; }
    let typingTimer: ReturnType<typeof setInterval> | undefined;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hold = () => {
      clearInterval(typingTimer);
      setIntroText(intro.message); setIntroPhase("hold");
      holdTimer = setTimeout(() => {
        setIntroPhase("fade");
        fadeTimer = setTimeout(() => setIntroPhase("idle"), motion.matches ? 0 : 400);
      }, 2400);
    };
    if (motion.matches) hold();
    else {
      const characters = Array.from(intro.message); let count = 0;
      setIntroText(""); setIntroPhase("typing");
      typingTimer = setInterval(() => {
        count += 1; setIntroText(characters.slice(0, count).join(""));
        if (count >= characters.length) hold();
      }, 28);
    }
    return () => { clearInterval(typingTimer); clearTimeout(holdTimer); clearTimeout(fadeTimer); };
  }, [intro?.id, intro?.message, interrupted]);
  const showingIntro = introPhase !== "idle" && !interrupted && !text && !attachment;
  const standby = ar ? "البيت محتاج إيه النهارده؟" : "What does your home need today?";

  function attach(file?: File) {
    if (!file) return;
    setInterrupted(true);
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setError(ar ? "اختاري صورة حجمها أقل من ١٠ ميجا." : "Choose an image smaller than 10 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => { setAttachment({ url: String(reader.result), name: file.name }); toast.success(ar ? "الصورة اتضافت للجلسة" : "Photo attached for this session"); };
    reader.onerror = () => setError(ar ? "الصورة مفتحتش. جرّبي تاني." : "That image couldn’t be opened. Try again.");
    reader.readAsDataURL(file);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() && !attachment) return;
    if (onSend) { onSend({ draft: text.trim(), attachment }); setText(""); setAttachment(null); }
    else navigate("/chat", { state: { draft: text.trim(), attachment } });
  }

  return <form className="home-composer" onSubmit={submit}>
    <label className="sr-only" htmlFor="home-message-input">{ar ? "رسالتك لمساعد وفّر" : "Your message to Wafar"}</label>
    {showingIntro && introPhase === "hold" && <span className="sr-only" role="status">{intro?.message}</span>}
    <textarea id="home-message-input" value={text} onFocus={() => setInterrupted(true)} onChange={event => { setInterrupted(true); setText(event.target.value); }} data-intro-phase={showingIntro ? introPhase : "idle"} placeholder={showingIntro ? introText : standby} rows={3} maxLength={2000} />
    {attachment && <div className="composer-attachment"><img src={attachment.url} alt={ar ? "الصورة المرفقة" : "Attached photo"} /><span>{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} aria-label={ar ? "امسحي الصورة" : "Remove photo"}><X size={16} /></button></div>}
    {error && <p className="composer-error" role="alert">{error}</p>}
    <div className="composer-toolbar">
      <span className="composer-caption">{ar ? "مساعد وفّر" : "Ask Wafar"}<span>{ar ? "نص أو صورة" : "Text or photo"}</span></span>
      <div className="composer-actions">
        <button type="button" className="composer-tool" onClick={() => camera.current?.click()} aria-label={ar ? "صوّري قائمة أو فاتورة" : "Take a photo"} title={ar ? "صوّري قائمة أو فاتورة" : "Snap a list or receipt"}><Camera size={21} /></button>
        <button type="button" className="composer-tool composer-upload" onClick={() => upload.current?.click()} aria-label={ar ? "ارفعي صورة" : "Attach an image"}><ImagePlus size={21} /></button>
        <button type="submit" className="composer-send" disabled={!text.trim() && !attachment} aria-label={ar ? "ابعتي الرسالة" : "Send message"}><ArrowUp size={23} /></button>
      </div>
    </div>
    <input ref={camera} hidden type="file" accept="image/*" capture="environment" onChange={event => { attach(event.target.files?.[0]); event.target.value = ""; }} />
    <input ref={upload} hidden type="file" accept="image/*" onChange={event => { attach(event.target.files?.[0]); event.target.value = ""; }} />
  </form>;
}
