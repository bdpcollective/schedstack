"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="px-3 py-1.5 text-sm rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50 transition-colors border border-gray-200 cursor-pointer text-gray-600"
    >
      {loading ? "Refreshing…" : "Refresh"}
    </button>
  );
}
