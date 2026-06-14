import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { Home } from "@/pages/Home";
import { CategoryPage } from "@/pages/CategoryPage";
import { ProductPage } from "@/pages/ProductPage";
import { OrdersPage } from "@/pages/OrdersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "category/:slug", element: <CategoryPage /> },
      { path: "product/:id", element: <ProductPage /> },
      { path: "orders", element: <OrdersPage /> },
      // Future: /cart, /quick, /chat, /restock
    ],
  },
]);
