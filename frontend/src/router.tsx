import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { Home } from "@/pages/Home";
import { CategoryPage } from "@/pages/CategoryPage";
import { ProductPage } from "@/pages/ProductPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrderSuccessPage } from "@/pages/OrderSuccessPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "category/:slug", element: <CategoryPage /> },
      { path: "product/:id", element: <ProductPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "order-success", element: <OrderSuccessPage /> },
      { path: "orders", element: <OrdersPage /> },
    ],
  },
]);
