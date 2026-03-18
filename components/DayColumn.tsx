import { formatDayHeader, isToday, assignmentsDueOn } from "@/lib/dates";
import { format } from "date-fns";
import AssignmentCard from "./AssignmentCard";
import AddTaskButton from "./AddTaskButton";
import type { Assignment, AssignmentType, Child } from "@/lib/parentvue/types";

export default function DayColumn({
  date,
  assignments,
  children,
  onAdd,
  onDelete,
}: {
  date: Date;
  assignments: Assignment[];
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
  onDelete: (id: string) => void;
}) {
  const today = isToday(date);
  const due = assignmentsDueOn(assignments, date);
  const { dayName, dayNum } = formatDayHeader(date);
  const isoDate = format(date, "yyyy-MM-dd");

  return (
    <div className="flex flex-col min-w-[calc(50vw-20px)] snap-start md:min-w-0 md:snap-align-none px-1 sm:px-1.5">
      {/* Day header */}
      <div className="flex flex-col items-center py-2 sm:py-3 relative">
        <span
          className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-wider ${
            today ? "text-red-500" : "text-gray-400"
          }`}
        >
          {dayName}
        </span>
        <span
          className={`mt-0.5 sm:mt-1 text-lg sm:text-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full ${
            today
              ? "bg-red-500 text-white font-medium"
              : "text-gray-700 font-light"
          }`}
        >
          {dayNum}
        </span>
        <div className="absolute right-0 top-2 sm:top-3">
          <AddTaskButton date={isoDate} children={children} onAdd={onAdd} />
        </div>
      </div>

      <div className="h-px bg-gray-200" />

      {/* Assignments */}
      <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 pt-1.5 sm:pt-2">
        {due.length === 0 && (
          <p className="text-[10px] sm:text-[11px] text-gray-300 text-center mt-6 sm:mt-8">
            No assignments
          </p>
        )}
        {due.map((a) => (
          <AssignmentCard
            key={a.id}
            assignment={a}
            onDelete={a.id.startsWith("custom-") ? () => onDelete(a.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
