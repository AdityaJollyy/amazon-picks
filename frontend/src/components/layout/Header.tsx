import { Link } from "react-router-dom";
import { CartIcon, ChevronDownIcon, PinIcon, SearchIcon } from "@/components/ui/Icons";

const SEARCH_CATEGORIES = [
  "All",
  "Groceries",
  "Fresh",
  "Pharmacy",
  "Electronics",
  "Home",
  "Beauty",
  "Baby",
];

type HeaderProps = {
  /** Dummy: number shown in the cart badge. */
  cartCount?: number;
  /** Dummy: location label shown in the pill. */
  zoneLabel?: string;
  /** Dummy: short user greeting. */
  userName?: string;
};

export function Header({
  cartCount = 0,
  zoneLabel = "Saket 110017",
  userName = "Aarav",
}: HeaderProps) {
  return (
    <header className="bg-[var(--color-amazon-navy)] text-white">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-4">
        {/* Logo */}
        <Link
          to="/"
          aria-label="Zip — go home"
          className="flex shrink-0 items-end rounded-sm border border-transparent px-2 py-2 hover:border-white"
        >
          <span className="text-2xl font-extrabold leading-none tracking-tight">
            zip
          </span>
          <span className="ml-0.5 text-2xl font-extrabold leading-none text-[var(--color-amazon-yellow)]">
            .
          </span>
          <span className="ml-1 hidden pb-0.5 text-[10px] font-medium text-white/70 sm:inline">
            in
          </span>
        </Link>

        {/* Location pill */}
        <button
          type="button"
          className="hidden shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 text-left hover:border-white md:flex"
        >
          <PinIcon className="mt-3 h-5 w-5 text-white" />
          <span className="leading-tight">
            <span className="block text-[12px] text-white/70">Deliver to</span>
            <span className="block text-sm font-bold">{zoneLabel}</span>
          </span>
        </button>

        {/* Search bar */}
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="flex h-10 min-w-0 flex-1 overflow-hidden rounded-md focus-within:ring-2 focus-within:ring-[var(--color-amazon-yellow)]"
        >
          <label className="hidden shrink-0 items-center gap-1 border-r border-slate-300 bg-slate-200 px-2 text-xs text-slate-900 hover:bg-slate-300 sm:flex">
            <select
              defaultValue="All"
              aria-label="Search category"
              className="appearance-none bg-transparent py-1 pr-4 text-xs text-slate-900 focus:outline-none"
            >
              {SEARCH_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="-ml-4 h-3 w-3 text-slate-700" />
          </label>
          <input
            type="search"
            placeholder="Search Zip"
            aria-label="Search Zip"
            className="min-w-0 flex-1 bg-white px-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex shrink-0 items-center justify-center bg-[var(--color-amazon-yellow)] px-3 text-slate-900 hover:bg-[var(--color-amazon-yellow-hover)] sm:px-4"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </form>

        {/* Account */}
        <button
          type="button"
          className="hidden shrink-0 rounded-sm border border-transparent px-2 py-1.5 text-left leading-tight hover:border-white md:block"
        >
          <span className="block text-[12px] text-white/70">Hello, {userName}</span>
          <span className="flex items-center text-sm font-bold">
            Account &amp; Lists
            <ChevronDownIcon className="ml-0.5 h-3 w-3 text-white/70" />
          </span>
        </button>

        {/* Cart */}
        <Link
          to="/cart"
          aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
          className="relative flex shrink-0 items-end rounded-sm border border-transparent px-2 py-2 hover:border-white"
        >
          <div className="relative">
            <CartIcon className="h-8 w-8" />
            <span
              aria-hidden="true"
              className="absolute -top-1 left-4 min-w-[20px] rounded-full bg-[var(--color-amazon-orange)] px-1 text-center text-xs font-bold leading-5 text-slate-900"
            >
              {cartCount}
            </span>
          </div>
          <span className="ml-1 hidden text-sm font-bold sm:inline">Cart</span>
        </Link>
      </div>
    </header>
  );
}
