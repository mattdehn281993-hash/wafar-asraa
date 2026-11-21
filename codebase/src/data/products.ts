import milkImage from "../assets/products/milk.jpg";
import cheeseImage from "../assets/products/cheese.jpg";
import riceImage from "../assets/products/rice.jpg";
import oilImage from "../assets/products/oil.jpg";
import eggsImage from "../assets/products/eggs.jpg";
import breadImage from "../assets/products/bread.jpg";
import teaImage from "../assets/products/tea.jpg";
import soapImage from "../assets/products/soap.jpg";

export type Product = {
  id: string;
  name: string;
  ar: string;
  size: string;
  price: number;
  high: number;
  saving: number;
  tone: string;
  kind: "milk" | "cheese" | "rice" | "oil" | "eggs" | "bread" | "tea" | "soap";
  image: string;
};

export const products: Product[] = [
  { id: "milk", name: "Full cream milk", ar: "حليب كامل الدسم", size: "Juhayna · 1 L", price: 38, high: 47, saving: 19, tone: "blue", kind: "milk", image: milkImage },
  { id: "cheese", name: "White cheese", ar: "جبنة بيضاء", size: "Domty · 500 g", price: 72, high: 85, saving: 15, tone: "cream", kind: "cheese", image: cheeseImage },
  { id: "rice", name: "Egyptian rice", ar: "أرز مصري", size: "5 kg", price: 165, high: 189, saving: 13, tone: "sand", kind: "rice", image: riceImage },
  { id: "oil", name: "Sunflower oil", ar: "زيت عباد الشمس", size: "1.5 L", price: 105, high: 135, saving: 22, tone: "amber", kind: "oil", image: oilImage },
  { id: "eggs", name: "Fresh eggs", ar: "بيض طازج", size: "Tray of 30", price: 160, high: 175, saving: 9, tone: "peach", kind: "eggs", image: eggsImage },
  { id: "bread", name: "Baladi bread", ar: "عيش بلدي", size: "Pack of 10", price: 15, high: 18, saving: 17, tone: "brown", kind: "bread", image: breadImage },
  { id: "tea", name: "Loose tea", ar: "شاي سائب", size: "250 g", price: 88, high: 99, saving: 11, tone: "green", kind: "tea", image: teaImage },
  { id: "soap", name: "Dish soap", ar: "سائل أطباق", size: "Fresh · 1 L", price: 42, high: 52, saving: 19, tone: "aqua", kind: "soap", image: soapImage },
];

export const stores = [
  { name: "Al Nour", ar: "النور", price: 72, distance: "1.2 km", letter: "N", color: "#0f7b5f" },
  { name: "Fresh Corner", ar: "فريش كورنر", price: 78, distance: "1.8 km", letter: "F", color: "#376fa8" },
  { name: "Baraka", ar: "بركة", price: 80, distance: "2.1 km", letter: "B", color: "#d47732" },
  { name: "Masr Hyper", ar: "مصر هايبر", price: 85, distance: "3.4 km", letter: "M", color: "#8b4c79" },
];
