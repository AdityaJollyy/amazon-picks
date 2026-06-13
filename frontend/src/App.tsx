import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { CartProvider } from "@/features/cart/CartProvider";
import { AiPanelProvider } from "@/features/ai/AiPanelProvider";

export default function App() {
  return (
    <CartProvider>
      <AiPanelProvider>
        <RouterProvider router={router} />
      </AiPanelProvider>
    </CartProvider>
  );
}
