import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import type { Assignment, AssignmentType } from "./parentvue/types";

const TASKS_PATH = join(process.cwd(), "data", "tasks.json");

interface StoredTask {
  id: string;
  name: string;
  type: AssignmentType;
  dueDate: string;
  childName: string;
  childColor: string;
}

async function readTasks(): Promise<StoredTask[]> {
  try {
    const raw = await readFile(TASKS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeTasks(tasks: StoredTask[]): Promise<void> {
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

export async function loadTasks(): Promise<Assignment[]> {
  const tasks = await readTasks();
  return tasks.map((t) => ({
    id: t.id,
    name: t.name,
    course: "Custom",
    type: t.type,
    dueDate: t.dueDate,
    assignedDate: t.dueDate,
    score: "",
    pointsPossible: "",
    notes: "",
    isNotForGrading: false,
    childName: t.childName,
    childColor: t.childColor,
  }));
}

export async function saveTask(input: {
  name: string;
  type: AssignmentType;
  dueDate: string;
  childName: string;
  childColor: string;
}): Promise<StoredTask> {
  const tasks = await readTasks();
  const task: StoredTask = { id: `custom-${randomUUID()}`, ...input };
  tasks.push(task);
  await writeTasks(tasks);
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await readTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  await writeTasks(filtered);
  return true;
}
