import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { QuickMode } from "@/features/ai/QuickMode";

export function RootLayout() {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#eaeded]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* The whole header (top + sub nav) sticks together — matches prototype.
          Inside-page sticky elements should use top: ~118px to clear it. */}
      <div className="sticky top-0 z-40">
        <Header userName="Aarav" />
        <CategoryNav />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#232f3e] py-3 text-center text-[12px] text-white/70">
        Built for Amazon HackOn 6.0 · quick-commerce in seconds
      </footer>
      <QuickMode />
    </div>
  );
}
