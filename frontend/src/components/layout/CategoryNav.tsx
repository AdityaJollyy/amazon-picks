import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
        // Silent — sub-nav is decorative if categories fail.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav aria-label="Categories" className="bg-[#232f3e] text-white">
      <div className="mx-auto flex max-w-[1680px] items-center gap-0.5 overflow-x-auto px-3 py-0">
        <Link
          to="/category/all"
          className="flex shrink-0 items-center gap-1.5 rounded-[3px] border border-transparent px-2.5 py-2.5 text-[14px] font-bold text-white hover:border-white"
        >
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M1 2h16M1 7h16M1 12h16" strokeLinecap="round" />
          </svg>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/category/${c.slug}`}
            className="shrink-0 whitespace-nowrap rounded-[3px] border border-transparent px-2.5 py-2.5 text-[13.5px] text-[#e7eaed] hover:border-white hover:text-white"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
