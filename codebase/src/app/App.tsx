import { RouterProvider } from "react-router";
import { AppProvider } from "./AppContext";
import { router } from "./routes";
import { AppToaster } from "@/components/ui/ding-toast";

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <AppToaster />
    </AppProvider>
  );
}
