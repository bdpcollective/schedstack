import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import type { Assignment } from "./parentvue/types";

export function getWeekDays(weekOffset = 0): Date[] {
  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 0,
  });
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatWeekRange(days: Date[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  if (format(first, "MMM") === format(last, "MMM")) {
    return `${format(first, "MMM d")} – ${format(last, "d, yyyy")}`;
  }
  return `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
}

export function isCurrentWeek(weekOffset: number): boolean {
  return weekOffset === 0;
}

export function formatDayHeader(date: Date) {
  return {
    dayName: format(date, "EEE"),
    dayNum: format(date, "d"),
    monthName: format(date, "MMM"),
  };
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function getRelativeDueLabel(dueDate: string): string {
  const diff = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return "";
}

export function assignmentsDueOn(
  assignments: Assignment[],
  date: Date
): Assignment[] {
  return assignments.filter((a) => isSameDay(parseISO(a.dueDate), date));
}
