import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { AiPanel } from "@/features/ai/AiPanel";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header zoneLabel="Saket 110017" userName="Aarav" />
      <CategoryNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[var(--color-amazon-navy-light)] text-white/70 text-xs py-3 text-center">
        Built for Amazon HackOn 6.0 — quick-commerce in seconds
      </footer>
      <CartDrawer />
      <AiPanel />
    </div>
  );
}
