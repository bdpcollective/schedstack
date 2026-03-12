import type { Assignment } from "@/lib/parentvue/types";

const TYPE_STYLES: Record<string, { badge: string; label: string }> = {
  test:     { badge: "bg-red-50 text-red-600",       label: "Test" },
  quiz:     { badge: "bg-orange-50 text-orange-600",  label: "Quiz" },
  project:  { badge: "bg-purple-50 text-purple-600",  label: "Project" },
  homework: { badge: "bg-blue-50 text-blue-600",     label: "HW" },
  other:    { badge: "bg-gray-100 text-gray-500",    label: "Other" },
};

const CHILD_CARD_STYLES: Record<string, { border: string; bg: string; hover: string }> = {
  "bg-blue-500":    { border: "border-l-blue-500",    bg: "bg-blue-50",    hover: "hover:bg-blue-100" },
  "bg-emerald-500": { border: "border-l-emerald-500", bg: "bg-emerald-50", hover: "hover:bg-emerald-100" },
  "bg-violet-500":  { border: "border-l-violet-500",  bg: "bg-violet-50",  hover: "hover:bg-violet-100" },
  "bg-amber-500":   { border: "border-l-amber-500",   bg: "bg-amber-50",   hover: "hover:bg-amber-100" },
  "bg-rose-500":    { border: "border-l-rose-500",    bg: "bg-rose-50",    hover: "hover:bg-rose-100" },
};

export default function AssignmentCard({
  assignment,
}: {
  assignment: Assignment;
}) {
  const typeStyle = TYPE_STYLES[assignment.type] ?? TYPE_STYLES.other;
  const cardStyle = CHILD_CARD_STYLES[assignment.childColor] ?? {
    border: "border-l-gray-400", bg: "bg-gray-50", hover: "hover:bg-gray-100",
  };

  return (
    <div
      className={`rounded-md sm:rounded-lg p-1.5 sm:p-2 border-l-2 transition-colors ${cardStyle.border} ${cardStyle.bg} ${cardStyle.hover}`}
    >
      <p className="text-[11px] sm:text-[12px] font-normal text-gray-800 leading-snug line-clamp-2">
        {assignment.name}
      </p>
      <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 truncate">
        {assignment.course}
      </p>
      <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 flex-wrap">
        <span
          className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-px rounded-full font-medium ${typeStyle.badge}`}
        >
          {typeStyle.label}
        </span>
        {assignment.score &&
          assignment.score !== "Not Graded" &&
          assignment.score !== "Not Due" && (
            <span className="text-[9px] sm:text-[10px] text-gray-400">
              {assignment.score}
            </span>
          )}
        <span className="text-[9px] sm:text-[10px] text-gray-400 ml-auto">
          {assignment.childName}
        </span>
      </div>
    </div>
  );
}
