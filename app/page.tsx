import { getCachedData } from "@/lib/cache";
import { getWeekDays } from "@/lib/dates";
import WeekCalendar from "@/components/WeekCalendar";
import ChildLegend from "@/components/ChildLegend";
import RefreshButton from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getCachedData();

  return (
    <main className="min-h-dvh bg-white text-gray-900 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
      <div className="mx-auto w-full max-w-screen-2xl">
        <header className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-gray-900">
              SchedStack
            </h1>
            <span className="text-[10px] sm:text-[11px] text-gray-400">
              {new Date(data.lastRefreshed).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ChildLegend childrenData={data.children} />
            <RefreshButton />
          </div>
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
