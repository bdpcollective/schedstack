import { NextRequest, NextResponse } from "next/server";
import { saveTask, deleteTask } from "@/lib/tasks";
import { invalidateCache } from "@/lib/cache";
import type { AssignmentType } from "@/lib/parentvue/types";

const VALID_TYPES: AssignmentType[] = ["test", "quiz", "homework", "project", "other"];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, dueDate, childName, childColor } = body;

  if (!name || !type || !dueDate || !childName || !childColor) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const task = await saveTask({ name, type, dueDate, childName, childColor });
  await invalidateCache();
  return NextResponse.json(task, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const deleted = await deleteTask(id);
  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await invalidateCache();
  return NextResponse.json({ success: true });
}
