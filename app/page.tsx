"use client";

import { useEffect, useState } from "react";
import { getWeekDays } from "@/lib/dates";
import WeekCalendar from "@/components/WeekCalendar";
import ChildLegend from "@/components/ChildLegend";
import type { SchedStackData } from "@/lib/parentvue/types";

const DATA_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data.json`;

export default function HomePage() {
  const [data, setData] = useState<SchedStackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-white text-gray-900">
        <p className="text-sm text-red-600">Failed to load data: {error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-white text-gray-900">
        <p className="text-sm text-gray-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white text-gray-900 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
      <div className="mx-auto w-full max-w-screen-2xl">
        <header className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-gray-900">
              SchedStack
            </h1>
            <span className="text-[10px] sm:text-[11px] text-gray-400">
              Updated{" "}
              {new Date(data.lastRefreshed).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <ChildLegend childrenData={data.children} />
        </header>
        <WeekCalendar
          assignments={data.assignments}
          initialDays={getWeekDays(0).map((d) => d.toISOString())}
          children={data.children}
        />
      </div>
    </main>
  );
}
