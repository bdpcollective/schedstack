"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssignmentType, Child } from "@/lib/parentvue/types";

const TYPES: { value: AssignmentType; label: string }[] = [
  { value: "homework", label: "Homework" },
  { value: "test", label: "Test" },
  { value: "quiz", label: "Quiz" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
];

export default function AddTaskModal({
  date,
  children,
  onClose,
}: {
  date: string; // ISO YYYY-MM-DD
  children: Child[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<AssignmentType>("homework");
  const [childIdx, setChildIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const selectedChild = children[childIdx];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !selectedChild) return;

    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          dueDate: date,
          childName: selectedChild.name,
          childColor: selectedChild.color,
        }),
      });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-[340px] sm:w-[380px] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          New Task
        </h3>

        {/* Title */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Title
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Assignment name"
            autoFocus
            required
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </label>

        {/* Type */}
        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AssignmentType)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        {/* Child */}
        {children.length > 1 && (
          <label className="block mb-4">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Child
            </span>
            <select
              value={childIdx}
              onChange={(e) => setChildIdx(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {children.map((c, i) => (
                <option key={c.intID} value={i}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Date display */}
        <div className="mb-5 text-xs text-gray-400">
          Due: {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "Adding…" : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
