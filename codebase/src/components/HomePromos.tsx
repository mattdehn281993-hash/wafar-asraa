import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../app/AppContext";
import { SqueezeCarousel, type SqueezeSlide } from "./ui/carousel-squeeze";
import freshWeekAr from "../assets/promos/fresh-week-ar.jpg";
import pantryDaysAr from "../assets/promos/pantry-days-ar.jpg";
import homeRefreshAr from "../assets/promos/home-refresh-ar.jpg";
import freshWeek from "../assets/promos/fresh-week.jpg";
import pantryDays from "../assets/promos/pantry-days.jpg";
import homeRefresh from "../assets/promos/home-refresh.jpg";

/** Independent generated ad creatives; every caption is inside the artwork. */
export function HomePromos() {
  const { t, language } = useApp();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(true);
  const openOffers = (campaign: string) => navigate(`/deals?campaign=${campaign}`);
  const slides: SqueezeSlide[] = [
    { id: "fresh-week", title: t("Fresh week · 20% off · Demo offer", "أسبوع الطازة · خصم ٢٠٪ · عرض تجريبي"), image: language === "ar" ? freshWeekAr : freshWeek, onAction: () => openOffers("fresh-week") },
    { id: "pantry-days", title: t("Pantry days · 25% off · Demo offer", "أيام أساسيات المطبخ · خصم ٢٥٪ · عرض تجريبي"), image: language === "ar" ? pantryDaysAr : pantryDays, onAction: () => openOffers("pantry-days") },
    { id: "home-refresh", title: t("Home refresh · 30% off · Demo offer", "جدّدي بيتك · خصم ٣٠٪ · عرض تجريبي"), image: language === "ar" ? homeRefreshAr : homeRefresh, onAction: () => openOffers("home-refresh") },
  ];
  return <section className="home-promos" aria-label={t("Sample discount advertisements", "إعلانات خصومات تجريبية")}>
    <SqueezeCarousel key={language} slides={slides} className="home-promo-carousel" dir={language === "ar" ? "rtl" : "ltr"} height="clamp(92px, 33cqi, 130px)" gap={6} slatWidth={4} slatGap={4} radius={13} duration={650} hoverGrow={false} autoplay={playing} interval={7000} showDetails={false} previousLabel={t("Previous promotion", "العرض السابق")} nextLabel={t("Next promotion", "العرض التالي")} label={t("Demo discount ads · Select another image or open offers", "إعلانات خصومات تجريبية · اختاري صورة تانية أو افتحي العروض")} />
    <button className="promo-play-toggle" type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? t("Pause promotions", "وقّفي العروض") : t("Play promotions", "شغّلي العروض")}>{playing ? <Pause size={12} /> : <Play size={12} />}</button>
  </section>;
}