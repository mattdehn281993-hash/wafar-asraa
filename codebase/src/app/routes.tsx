import { createBrowserRouter } from "react-router";
import { AppShell } from "../components/AppShell";
import {
  CartScreen,
  ChatScreen,
  CheckoutScreen,
  AccountScreen,
  AlertsScreen,
  DealsScreen,
  FamilyScreen,
  HomeScreen,
  NotFoundScreen,
  ShopScreen,
  ScanScreen,
  SpendingScreen,
  SuccessScreen,
} from "../screens/Screens";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: HomeScreen },
      { path: "shop", Component: ShopScreen },
      { path: "deals", Component: DealsScreen },
      { path: "spending", Component: SpendingScreen },
      { path: "family", Component: FamilyScreen },
      { path: "chat", Component: ChatScreen },
      { path: "cart", Component: CartScreen },
      { path: "checkout", Component: CheckoutScreen },
      { path: "success", Component: SuccessScreen },
      { path: "account", Component: AccountScreen },
      { path: "alerts", Component: AlertsScreen },
      { path: "scan", Component: ScanScreen },
      { path: "*", Component: NotFoundScreen },
    ],
  },
], {
  // "/" unless the app is built for a sub-folder (BASE_PATH, see vite.config.ts).
  basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
});
