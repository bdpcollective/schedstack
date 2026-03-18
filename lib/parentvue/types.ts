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

export interface SchedStackData {
  children: Child[];
  assignments: Assignment[];
  lastRefreshed: string; // ISO datetime
}
