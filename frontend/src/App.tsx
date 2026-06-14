import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { CartProvider } from "@/features/cart/CartProvider";
import { AiPanelProvider } from "@/features/ai/AiPanelProvider";
import { ZoneProvider } from "@/features/zone/ZoneProvider";
import { ToastProvider } from "@/features/toast/ToastProvider";

export default function App() {
  return (
    <ZoneProvider>
      <CartProvider>
        <ToastProvider>
          <AiPanelProvider>
            <RouterProvider router={router} />
          </AiPanelProvider>
        </ToastProvider>
      </CartProvider>
    </ZoneProvider>
  );
}
