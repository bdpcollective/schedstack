"use client";

import { useState, useMemo } from "react";
import { getWeekDays, formatWeekRange, isCurrentWeek } from "@/lib/dates";
import DayColumn from "./DayColumn";
import type { Assignment, Child } from "@/lib/parentvue/types";

export default function WeekCalendar({
  assignments,
  initialDays,
  children,
}: {
  assignments: Assignment[];
  initialDays: string[];
  children: Child[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const onCurrentWeek = isCurrentWeek(weekOffset);

  const days = useMemo(() => {
    if (onCurrentWeek) return initialDays.map((iso) => new Date(iso));
    return getWeekDays(weekOffset);
  }, [weekOffset, onCurrentWeek, initialDays]);

  const weekRange = formatWeekRange(days);

  return (
    <div className="flex flex-col flex-1">
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={() => setWeekOffset(0)}
          disabled={onCurrentWeek}
          className="px-2.5 py-1 text-xs sm:text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
        >
          Today
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Previous week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <h2 className="text-sm sm:text-base font-medium text-gray-900 min-w-[150px] sm:min-w-[180px] text-center">
            {weekRange}
          </h2>

          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Next week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="w-[52px] sm:w-[60px]" />
      </div>

      {/* Day columns */}
      <div className="flex overflow-x-auto pb-4 hide-scrollbar md:grid md:grid-cols-7 md:overflow-visible md:divide-x md:divide-gray-200 flex-1">
        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            assignments={assignments}
          />
        ))}
      </div>
    </div>
  );
}
