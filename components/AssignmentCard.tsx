import type { Assignment } from "@/lib/parentvue/types";
import { getRelativeDueLabel } from "@/lib/dates";

const TYPE_STYLES: Record<string, { badge: string; label: string }> = {
  test:     { badge: "bg-red-100 text-red-800",       label: "Test" },
  quiz:     { badge: "bg-orange-100 text-orange-800",  label: "Quiz" },
  project:  { badge: "bg-purple-100 text-purple-800",  label: "Project" },
  homework: { badge: "bg-blue-100 text-blue-800",     label: "HW" },
  other:    { badge: "bg-gray-200 text-gray-800",     label: "Other" },
};

const CHILD_CARD_STYLES: Record<string, { strip: string; bg: string; hover: string }> = {
  "bg-blue-500":    { strip: "bg-blue-500",    bg: "bg-blue-50",    hover: "hover:bg-blue-100" },
  "bg-emerald-500": { strip: "bg-emerald-700", bg: "bg-emerald-50", hover: "hover:bg-emerald-100" },
  "bg-violet-500":  { strip: "bg-violet-500",  bg: "bg-violet-50",  hover: "hover:bg-violet-100" },
  "bg-amber-500":   { strip: "bg-amber-500",   bg: "bg-amber-50",   hover: "hover:bg-amber-100" },
  "bg-rose-500":    { strip: "bg-rose-500",    bg: "bg-rose-50",    hover: "hover:bg-rose-100" },
};

function formatScore(score: string, pointsPossible: string): string | null {
  if (!score || score === "Not Graded" || score === "Not Due") return null;
  if (pointsPossible) {
    const pts = parseFloat(pointsPossible);
    if (!isNaN(pts) && pts > 0) return `${score}/${Math.round(pts)}`;
  }
  return score;
}

function dueLabelColor(dueDate: string): string {
  const diff = Math.round(
    (new Date(dueDate).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
  );
  if (diff < 0) return "text-red-700";
  if (diff === 0) return "text-amber-700";
  return "text-[#000]";
}

export default function AssignmentCard({
  assignment,
  onDelete,
}: {
  assignment: Assignment;
  onDelete?: () => void;
}) {
  const typeStyle = TYPE_STYLES[assignment.type] ?? TYPE_STYLES.other;
  const cardStyle = CHILD_CARD_STYLES[assignment.childColor] ?? {
    strip: "bg-gray-400", bg: "bg-gray-50", hover: "hover:bg-gray-100",
  };
  const scoreDisplay = formatScore(assignment.score, assignment.pointsPossible);
  const dueLabel = getRelativeDueLabel(assignment.dueDate);

  return (
    <div
      className={`flex overflow-hidden rounded-r transition-colors text-left h-[140px] sm:h-[150px] ${cardStyle.bg} ${cardStyle.hover}`}
    >
      {/* Vertical name strip */}
      <div
        className={`relative flex-shrink-0 w-5 sm:w-6 ${cardStyle.strip}`}
      >
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[11px] font-bold text-white uppercase tracking-wider">
          {assignment.childName.split(" ")[0]}
        </span>
      </div>

      {/* Card content */}
      <div className="flex-1 p-1.5 sm:p-2 flex flex-col relative">
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Delete task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {dueLabel && (
          <p className={`text-[9px] sm:text-[10px] mb-0.5 font-medium ${dueLabelColor(assignment.dueDate)}`}>
            {dueLabel}
          </p>
        )}
        <p className="text-[16px] font-normal text-[#000] leading-snug line-clamp-2">
          {assignment.name}
        </p>
        <p className="text-[9px] sm:text-[10px] text-[#000] mt-0.5 truncate">
          {assignment.course}
        </p>
        {assignment.notes && (
          <p className="text-[9px] sm:text-[10px] text-[#000] mt-0.5 line-clamp-1 italic">
            {assignment.notes}
          </p>
        )}
        <div className="flex items-center gap-1 sm:gap-1.5 mt-auto pt-1.5 flex-wrap">
          <span
            className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-px rounded-full font-medium ${typeStyle.badge}`}
          >
            {typeStyle.label}
          </span>
          {assignment.isNotForGrading && (
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-px rounded-full font-medium bg-gray-200 text-gray-800">
              Practice
            </span>
          )}
        </div>
        {scoreDisplay && (
          <p className="text-[9px] sm:text-[10px] text-[#000] mt-1 font-medium">
            Grade: {scoreDisplay}
          </p>
        )}
      </div>
    </div>
  );
}
