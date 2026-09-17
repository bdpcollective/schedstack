"use client";

import { useState, useRef, useEffect } from "react";
import type { ChildSchedule } from "@/lib/parentvue/types";

const CHILD_TEXT_COLORS: Record<string, string> = {
  "bg-blue-500": "text-blue-700",
  "bg-emerald-500": "text-emerald-700",
  "bg-violet-500": "text-violet-700",
  "bg-amber-500": "text-amber-700",
  "bg-rose-500": "text-rose-700",
};

export default function SchedulePopover({
  schedules,
}: {
  schedules: ChildSchedule[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (schedules.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
        aria-label="View class schedule"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-3.5 h-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-h-72 overflow-y-auto">
          {schedules.map((sched, si) => (
            <div key={si} className={si > 0 ? "mt-2 pt-2 border-t border-gray-100" : ""}>
              <p
                className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                  CHILD_TEXT_COLORS[sched.childColor] ?? "text-gray-700"
                }`}
              >
                {sched.childName.split(" ")[0]}
                {sched.termName ? ` — ${sched.termName}` : ""}
              </p>
              <div className="space-y-0.5">
                {sched.periods.map((p, pi) => (
                  <div key={pi} className="flex items-start gap-1.5 text-[10px] sm:text-[11px]">
                    <span className="text-gray-400 w-4 text-right flex-shrink-0 font-medium">
                      {p.period}
                    </span>
                    <div className="min-w-0">
                      <span className="text-gray-900 font-medium">{p.courseTitle}</span>
                      {(p.roomName || p.teacher) && (
                        <span className="text-gray-400">
                          {p.roomName ? ` · Rm ${p.roomName}` : ""}
                          {p.teacher ? ` · ${p.teacher}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
