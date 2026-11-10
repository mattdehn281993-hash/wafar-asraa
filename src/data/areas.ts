// Prototype shopping areas within the Cairo/Giza launch scope.
export const cities = [
  { id: "cairo", en: "Cairo", ar: "القاهرة" },
  { id: "giza", en: "Giza", ar: "الجيزة" },
] as const;

export const areas = [
  { id: "new-cairo", city: "cairo", en: "New Cairo", ar: "القاهرة الجديدة" },
  { id: "nasr-city", city: "cairo", en: "Nasr City", ar: "مدينة نصر" },
  { id: "maadi", city: "cairo", en: "Maadi", ar: "المعادي" },
  { id: "heliopolis", city: "cairo", en: "Heliopolis", ar: "مصر الجديدة" },
  { id: "mokattam", city: "cairo", en: "Mokattam", ar: "المقطم" },
  { id: "sheikh-zayed", city: "giza", en: "Sheikh Zayed", ar: "الشيخ زايد" },
  { id: "6-october", city: "giza", en: "6th of October", ar: "٦ أكتوبر" },
  { id: "dokki", city: "giza", en: "Dokki", ar: "الدقي" },
  { id: "mohandessin", city: "giza", en: "Mohandessin", ar: "المهندسين" },
  { id: "haram", city: "giza", en: "Haram", ar: "الهرم" },
] as const;
export type AreaId = typeof areas[number]["id"];
export function isAreaId(value: unknown): value is AreaId { return areas.some(area => area.id === value); }
