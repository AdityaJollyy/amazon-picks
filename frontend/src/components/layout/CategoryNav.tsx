import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { MenuIcon } from "@/components/ui/Icons";
import { categoriesApi } from "@/api/products.api";
import type { Category } from "@/types/product";

export function CategoryNav() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    categoriesApi
      .list()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        // Silent — header still works without category links.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      aria-label="Categories"
      className="bg-[var(--color-amazon-navy-light)] text-white"
    >
      <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 py-1 text-sm sm:px-4">
        <Link
          to="/category/all"
          className="flex shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 font-bold hover:border-white"
        >
          <MenuIcon className="h-4 w-4" />
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/category/${c.slug}`}
            className="shrink-0 rounded-sm border border-transparent px-2 py-1.5 hover:border-white"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
