"use client";

import { useEffect, useState, useCallback } from "react";
import { getWeekDays } from "@/lib/dates";
import WeekCalendar from "@/components/WeekCalendar";
import { getLocalTasks, addLocalTask, deleteLocalTask } from "@/lib/local-tasks";
import type { Assignment, AssignmentType, SchedStackData } from "@/lib/parentvue/types";

const DATA_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data.json`;

export default function HomePage() {
  const [serverData, setServerData] = useState<SchedStackData | null>(null);
  const [localTasks, setLocalTasks] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: SchedStackData) => {
        setServerData(data);
        setLocalTasks(getLocalTasks());
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleAdd = useCallback(
    (input: {
      name: string;
      course: string;
      type: AssignmentType;
      dueDate: string;
      childName: string;
      childColor: string;
      notes: string;
    }) => {
      const task = addLocalTask(input);
      setLocalTasks((prev) => [...prev, task]);
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    deleteLocalTask(id);
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-white text-gray-900">
        <p className="text-sm text-red-600">Failed to load data: {error}</p>
      </main>
    );
  }

  if (!serverData) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-white text-gray-900">
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    );
  }

  const allAssignments = [...serverData.assignments, ...localTasks];

  return (
    <main className="min-h-dvh bg-white text-gray-900 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 overflow-x-hidden">
      <div className="mx-auto w-full max-w-screen-2xl">
        <header className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-gray-900">
              SchedStack
            </h1>
            <span className="text-[10px] sm:text-[11px] text-gray-400">
              Updated{" "}
              {new Date(serverData.lastRefreshed).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </header>
        <WeekCalendar
          assignments={allAssignments}
          initialDays={getWeekDays(0).map((d) => d.toISOString())}
          children={serverData.children}
          onAdd={handleAdd}
          onDelete={handleDelete}
        />
      </div>
    </main>
  );
}
