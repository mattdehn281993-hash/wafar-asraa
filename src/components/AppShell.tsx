import { BadgePercent, House, ShoppingBasket, TrendingUp, UsersRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useApp } from "../app/AppContext";

const tabs = [
  { to: "/", en: "Home", ar: "الرئيسية", icon: House },
  { to: "/shop", en: "Shop", ar: "تسوّق", icon: ShoppingBasket },
  { to: "/deals", en: "Deals", ar: "عروض", icon: BadgePercent },
  { to: "/spending", en: "Spending", ar: "مصروفات", icon: TrendingUp },
  { to: "/family", en: "Family", ar: "العيلة", icon: UsersRound },
];

export function AppShell() {
  const { language } = useApp();
  const location = useLocation();
  const isMain = tabs.some((tab) => tab.to === location.pathname);

  return (
    <div className="stage" dir={language === "ar" ? "rtl" : "ltr"}>
      <main className={`app-frame ${isMain ? "has-tabs" : ""}`}>
        <Outlet />
        {isMain && (
          <nav className="tab-bar" aria-label="Main navigation">
            {tabs.map(({ to, en, ar, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === "/"}>
                {({ isActive }) => (
                  <>
                    <span className={isActive ? "tab-icon active" : "tab-icon"}><Icon size={21} strokeWidth={isActive ? 2.6 : 1.9} /></span>
                    <span>{language === "ar" ? ar : en}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
}
