import { Link } from "react-router-dom";
import { MenuIcon } from "@/components/ui/Icons";

const CATEGORIES = [
  "Fresh",
  "Groceries",
  "Pharmacy",
  "Beauty",
  "Baby",
  "Home",
  "Electronics",
  "Snacks",
  "Beverages",
  "Pet Care",
];

export function CategoryNav() {
  return (
    <nav
      aria-label="Categories"
      className="bg-[var(--color-amazon-navy-light)] text-white"
    >
      <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 py-1 text-sm sm:px-4">
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 font-bold hover:border-white"
        >
          <MenuIcon className="h-4 w-4" />
          All
        </button>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            to={`/category/${c.toLowerCase().replace(/\s+/g, "-")}`}
            className="shrink-0 rounded-sm border border-transparent px-2 py-1.5 hover:border-white"
          >
            {c}
          </Link>
        ))}
      </div>
    </nav>
  );
}
