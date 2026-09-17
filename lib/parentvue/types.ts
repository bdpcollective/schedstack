export type AssignmentType = "test" | "quiz" | "homework" | "project" | "other";

export interface Assignment {
  id: string;
  name: string;
  course: string;
  type: AssignmentType;
  dueDate: string; // ISO YYYY-MM-DD
  assignedDate: string; // ISO YYYY-MM-DD
  score: string;
  pointsPossible: string;
  notes: string;
  isNotForGrading: boolean;
  childName: string;
  childColor: string;
}

export interface Child {
  intID: number;
  name: string;
  grade: string;
  color: string;
  lightColor: string;
  textColor: string;
}

export interface AttendanceEvent {
  date: string; // YYYY-MM-DD
  period: string; // "1", "2", or "All Day"
  status: "absent" | "tardy" | "excused" | "unexcused" | "other";
  reason: string;
  courseName: string;
  childName: string;
  childColor: string;
}

export interface ClassPeriod {
  period: string;
  courseTitle: string;
  roomName: string;
  teacher: string;
}

export interface ChildSchedule {
  childName: string;
  childColor: string;
  termName: string;
  periods: ClassPeriod[];
}

export interface SchedStackData {
  children: Child[];
  assignments: Assignment[];
  attendance?: AttendanceEvent[];
  schedules?: ChildSchedule[];
  lastRefreshed: string; // ISO datetime
}
