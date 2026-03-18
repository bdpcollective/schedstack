"use client";

import { useState } from "react";
import AddTaskModal from "./AddTaskModal";
import type { AssignmentType, Child } from "@/lib/parentvue/types";

export default function AddTaskButton({
  date,
  children,
  onAdd,
}: {
  date: string;
  children: Child[];
  onAdd: (input: {
    name: string;
    course: string;
    type: AssignmentType;
    dueDate: string;
    childName: string;
    childColor: string;
    notes: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);

  if (children.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors cursor-pointer"
        aria-label="Add task"
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
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>

      {open && (
        <AddTaskModal
          date={date}
          children={children}
          onAdd={onAdd}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
