import { motion } from "framer-motion";
import { useAsync } from "@/hooks/useAsync";
import { apiClient } from "@/api/apiClient";

type Health = {
  status: string;
  uptime?: number;
  timestamp?: string;
};

export function Home() {
  const health = useAsync<Health>(() => apiClient.get<Health>("/health"));

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-xl bg-white shadow-sm border border-slate-200 p-8"
      >
        <h1 className="text-3xl font-semibold text-slate-900">
          From intent to cart, in seconds.
        </h1>
        <p className="mt-2 text-slate-600">
          Frontend scaffold is live. Backend health check below confirms the
          API contract works end-to-end.
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4 font-mono text-sm">
          <div className="text-slate-500">GET /api/v1/health</div>
          <div className="mt-1">
            {health.loading && <span className="text-slate-500">loading…</span>}
            {health.error && (
              <span className="text-red-600">
                {health.error.statusCode} — {health.error.message}
              </span>
            )}
            {health.data && (
              <span className="text-emerald-700">
                {JSON.stringify(health.data)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
