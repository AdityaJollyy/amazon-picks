import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { CartProvider } from "@/features/cart/CartProvider";
import { AiPanelProvider } from "@/features/ai/AiPanelProvider";
import { VibeProvider } from "@/features/vibe/VibeProvider";

export default function App() {
  return (
    <VibeProvider>
      <CartProvider>
        <AiPanelProvider>
          <RouterProvider router={router} />
        </AiPanelProvider>
      </CartProvider>
    </VibeProvider>
  );
}
