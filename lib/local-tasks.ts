import type { Assignment, AssignmentType } from "./parentvue/types";

const STORAGE_KEY = "schedstack-tasks";

interface StoredTask {
  id: string;
  name: string;
  course: string;
  type: AssignmentType;
  dueDate: string;
  childName: string;
  childColor: string;
  notes: string;
}

function readTasks(): StoredTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: StoredTask[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function getLocalTasks(): Assignment[] {
  return readTasks().map((t) => ({
    id: t.id,
    name: t.name,
    course: t.course,
    type: t.type,
    dueDate: t.dueDate,
    assignedDate: t.dueDate,
    score: "",
    pointsPossible: "",
    notes: t.notes,
    isNotForGrading: false,
    childName: t.childName,
    childColor: t.childColor,
  }));
}

export function addLocalTask(input: {
  name: string;
  course: string;
  type: AssignmentType;
  dueDate: string;
  childName: string;
  childColor: string;
  notes: string;
}): Assignment {
  const tasks = readTasks();
  const id = `custom-${crypto.randomUUID()}`;
  const task: StoredTask = { id, ...input };
  tasks.push(task);
  writeTasks(tasks);
  return {
    id,
    name: input.name,
    course: input.course,
    type: input.type,
    dueDate: input.dueDate,
    assignedDate: input.dueDate,
    score: "",
    pointsPossible: "",
    notes: input.notes,
    isNotForGrading: false,
    childName: input.childName,
    childColor: input.childColor,
  };
}

export function deleteLocalTask(id: string): void {
  const tasks = readTasks().filter((t) => t.id !== id);
  writeTasks(tasks);
}
