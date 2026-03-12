import { callParentVue } from "./parentvue/client";
import { parseGradebook, parseStudentInfo } from "./parentvue/parser";
import { loadTasks } from "./tasks";
import type { Assignment, Child, SchedStackData } from "./parentvue/types";

const CHILD_COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-700" },
];

const MAX_CHILDREN = parseInt(process.env.PARENTVUE_MAX_CHILDREN ?? "5", 10);

export async function fetchAllData(): Promise<SchedStackData> {
  const children: Child[] = [];
  const allAssignments: Assignment[] = [];

  for (let i = 0; i < MAX_CHILDREN; i++) {
    try {
      const infoResponse = await callParentVue("StudentInfo", i);
      const info = await parseStudentInfo(infoResponse);

      const color = CHILD_COLORS[i % CHILD_COLORS.length];
      const child: Child = {
        intID: i,
        name: info.name,
        grade: info.grade,
        color: color.bg,
        lightColor: color.light,
        textColor: color.text,
      };
      children.push(child);

      const gradebookResponse = await callParentVue("Gradebook", i);
      const assignments = await parseGradebook(
        gradebookResponse,
        info.name,
        color.bg
      );
      allAssignments.push(...assignments);
    } catch (err) {
      console.error(`[SchedStack] Error fetching child ${i}:`, err);
      // If we haven't found any children yet, this is likely an auth/network error
      if (children.length === 0 && i === 0) {
        console.error("[SchedStack] First child fetch failed — check credentials and network");
      }
      break;
    }
  }

  const customTasks = await loadTasks();
  allAssignments.push(...customTasks);

  return {
    children,
    assignments: allAssignments,
    lastRefreshed: new Date().toISOString(),
  };
}
