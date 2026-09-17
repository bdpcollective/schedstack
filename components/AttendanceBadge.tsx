import type { AttendanceEvent } from "@/lib/parentvue/types";

const STATUS_COLORS: Record<string, string> = {
  absent: "bg-red-500",
  tardy: "bg-amber-500",
  excused: "bg-yellow-400",
  unexcused: "bg-red-700",
  other: "bg-gray-400",
};

function tooltipText(events: AttendanceEvent[]): string {
  return events
    .map((e) => {
      const name = e.childName.split(" ")[0];
      const label =
        e.status.charAt(0).toUpperCase() + e.status.slice(1);
      const period = e.period === "All Day" ? "" : ` P${e.period}`;
      const course = e.courseName ? ` (${e.courseName})` : "";
      return `${name}: ${label}${period}${course}`;
    })
    .join("\n");
}

export default function AttendanceBadge({
  events,
}: {
  events: AttendanceEvent[];
}) {
  if (events.length === 0) return null;

  // Group by child — show one dot per child, using worst status
  const byChild = new Map<string, AttendanceEvent[]>();
  for (const e of events) {
    const key = e.childName;
    if (!byChild.has(key)) byChild.set(key, []);
    byChild.get(key)!.push(e);
  }

  const STATUS_PRIORITY: Record<string, number> = {
    absent: 0,
    unexcused: 1,
    tardy: 2,
    excused: 3,
    other: 4,
  };

  const dots: { color: string; childEvents: AttendanceEvent[] }[] = [];
  for (const [, childEvents] of byChild) {
    // Pick worst status for the dot color
    const worst = childEvents.reduce((a, b) =>
      (STATUS_PRIORITY[a.status] ?? 5) <= (STATUS_PRIORITY[b.status] ?? 5) ? a : b
    );
    dots.push({
      color: STATUS_COLORS[worst.status] ?? STATUS_COLORS.other,
      childEvents,
    });
  }

  return (
    <div
      className="flex items-center gap-1 mt-0.5"
      title={tooltipText(events)}
    >
      {dots.map((dot, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${dot.color}`}
        />
      ))}
    </div>
  );
}
