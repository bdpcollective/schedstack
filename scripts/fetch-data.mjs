#!/usr/bin/env node

/**
 * Standalone script to fetch ParentVUE data and write public/data.json.
 * Runs in GitHub Actions before `next build`.
 *
 * Uses the new ParentVUE JSON API (replaces deprecated SOAP/PXPCommunication.asmx).
 *
 * Required env vars: PARENTVUE_URL, PARENTVUE_USERNAME, PARENTVUE_PASSWORD
 * Optional: PARENTVUE_MAX_CHILDREN (default 5)
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const BASE_URL = process.env.PARENTVUE_URL;
const USERNAME = process.env.PARENTVUE_USERNAME;
const PASSWORD = process.env.PARENTVUE_PASSWORD;
const MAX_CHILDREN = parseInt(process.env.PARENTVUE_MAX_CHILDREN ?? "5", 10);

const CHILD_COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-700" },
];

if (!BASE_URL || !USERNAME || !PASSWORD) {
  console.error("Missing PARENTVUE_URL, PARENTVUE_USERNAME, or PARENTVUE_PASSWORD");
  process.exit(1);
}

const API_BASE = `${BASE_URL}/api/v1/mobile/PXPWebServices`;

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "ksoap",
  AppNameOSAndVersion: "StudentVUE|Android|1.9.16",
};

// --- Authentication ---

async function login() {
  const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");

  const res = await fetch(`${API_BASE}/AttemptLogin`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      arguments: {
        request: JSON.stringify({
          userID: null,
          password: null,
          userType: "parent",
        }),
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Login HTTP ${res.status}: ${res.statusText}`);
  }

  const body = await res.json();
  if (body.error) {
    throw new Error(`Login error: ${body.error.message ?? JSON.stringify(body.error)}`);
  }

  const token = body.access_token ?? body.data?.access_token;
  if (!token) {
    throw new Error(`Login failed — no access_token in response: ${JSON.stringify(body)}`);
  }

  return token;
}

// --- API caller ---

async function callApi(method, requestParams, token) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      arguments: {
        request: JSON.stringify(requestParams),
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`${method} HTTP ${res.status}: ${res.statusText}`);
  }

  const body = await res.json();
  if (body.error) {
    throw new Error(`${method} error: ${body.error.message ?? JSON.stringify(body.error)}`);
  }

  return body.data ?? body;
}

// --- Data fetching ---

async function getChildList(token) {
  const data = await callApi("GetChildListData", {
    legacyAppRequest: false,
    secondaryLogin: false,
  }, token);

  return data.children?.childrenList ?? data.childrenList ?? [];
}

async function getStudentInfo(childIntID, token) {
  const data = await callApi("GetStudentInfoData", { childIntID }, token);

  // Student details are in studentInfoDetailXML (despite the name, it's JSON)
  const info = data.studentInfoDetailXML ?? data.studentInfoXML ?? data;
  const rawName = info.formattedName ?? info.name ??
    `${info.firstName ?? ""} ${info.lastName ?? ""}`.trim();
  const name = rawName || "Student";
  const grade = info.grade ?? info.currentGradeLevel ?? "";

  return { name, grade };
}

async function getGradebook(childIntID, orgYearGU, childName, childColor, token) {
  const data = await callApi("Gradebook", {
    reportPeriod: "0",
    concurrentSchOrgYearGU: orgYearGU,
    childIntID,
    languageCode: "en",
  }, token);

  const gradebook = data.traditionalGradebook ?? data;
  const courses = gradebook.courses ?? [];
  const assignments = [];

  for (const course of courses) {
    const courseName = course.title ?? course.courseName ?? "Unknown";
    const marks = course.marks ?? [];
    for (const mark of marks) {
      const rawAssignments = mark.assignments ?? [];
      for (const a of rawAssignments) {
        const dueDate = a.dueDate ?? a.date;
        if (!dueDate) continue;
        // "points" is a string like "15 Points Possible" — extract the number
        const pointsMatch = (a.points ?? "").match(/^([\d.]+)/);
        const pointsPossible = a.pointPossible ?? pointsMatch?.[1] ?? "";
        assignments.push({
          id: String(a.gradebookID ?? `${courseName}-${a.measure ?? a.name}`),
          name: a.measure ?? a.name ?? "Untitled",
          course: courseName,
          type: normalizeType(a.type ?? ""),
          dueDate: normalizeDate(dueDate),
          assignedDate: normalizeDate(a.date ?? dueDate),
          score: a.score ?? a.displayScore ?? "",
          pointsPossible: String(pointsPossible),
          notes: a.notes ?? "",
          isNotForGrading: a.displayScore === "Not Graded" || a.score === null,
          childName,
          childColor,
        });
      }
    }
  }
  return assignments;
}

// --- Helpers ---

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  // If already ISO format (YYYY-MM-DD), return as-is
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  // Convert MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateStr.split("/");
  if (month && day && year) {
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

function normalizeType(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes("test") || lower.includes("exam") || lower.includes("final")) return "test";
  if (lower.includes("quiz")) return "quiz";
  if (lower.includes("project") || lower.includes("essay")) return "project";
  if (lower.includes("homework") || lower.includes("hw")) return "homework";
  return "other";
}

function loadCustomTasks() {
  try {
    const raw = readFileSync(join(ROOT, "data", "tasks.json"), "utf-8");
    const tasks = JSON.parse(raw);
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
  } catch {
    return [];
  }
}

const HISTORY_PATH = join(ROOT, "data", "assignments.json");
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

function loadHistory() {
  try {
    const raw = readFileSync(HISTORY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { children: [], assignments: [] };
  }
}

function mergeAssignments(existing, fresh) {
  const map = new Map();
  for (const a of existing) map.set(a.id, a);
  for (const a of fresh) map.set(a.id, a);

  const cutoff = new Date(Date.now() - SIX_MONTHS_MS).toISOString().slice(0, 10);
  const merged = [];
  for (const a of map.values()) {
    if (a.dueDate >= cutoff) merged.push(a);
  }

  return merged;
}

// --- Main ---

async function main() {
  console.log("[fetch-data] Starting ParentVUE data fetch (JSON API)...");

  // Authenticate
  console.log("[fetch-data] Logging in...");
  const token = await login();
  console.log("[fetch-data] Login successful.");

  const history = loadHistory();
  const children = [];
  const freshAssignments = [];

  // Get child list first
  let childList;
  try {
    childList = await getChildList(token);
    console.log(`[fetch-data] Found ${childList.length} children in account.`);
  } catch (err) {
    console.error("[fetch-data] Failed to get child list:", err.message);
    // Fall back to iterating by index
    childList = null;
  }

  const childCount = childList ? Math.min(childList.length, MAX_CHILDREN) : MAX_CHILDREN;

  for (let i = 0; i < childCount; i++) {
    try {
      const childEntry = childList ? childList[i] : null;
      const childIntID = childEntry?.childIntID ?? i;
      const color = CHILD_COLORS[i % CHILD_COLORS.length];

      // Get student info — use child list data as fallback
      let childName, childGrade;
      try {
        const info = await getStudentInfo(childIntID, token);
        childName = info.name;
        childGrade = info.grade;
      } catch {
        // Some schools don't support GetStudentInfoData — use child list data
        childName = childEntry?.childName ?? childEntry?.childFirstName ?? "Student";
        childGrade = childEntry?.grade ?? "";
        console.log(`[fetch-data] GetStudentInfoData unavailable for child ${i}, using child list data`);
      }

      children.push({
        intID: childIntID,
        name: childName,
        grade: childGrade,
        color: color.bg,
        lightColor: color.light,
        textColor: color.text,
      });

      // Get gradebook — concurrentSchOrgYearGU is left empty for primary school
      const assignments = await getGradebook(childIntID, "", childName, color.bg, token);
      freshAssignments.push(...assignments);

      console.log(`[fetch-data] Child ${i} (${childName}): ${assignments.length} new assignments`);
    } catch (err) {
      console.error(`[fetch-data] Error fetching child ${i}:`, err.message);
      if (children.length === 0 && i === 0) {
        console.error("[fetch-data] First child fetch failed — check credentials or API response");
        process.exit(1);
      }
      break;
    }
  }

  const customTasks = loadCustomTasks();
  freshAssignments.push(...customTasks);

  const allAssignments = mergeAssignments(history.assignments, freshAssignments);

  // Save accumulated history
  mkdirSync(join(ROOT, "data"), { recursive: true });
  const historyData = { children, assignments: allAssignments };
  writeFileSync(HISTORY_PATH, JSON.stringify(historyData, null, 2));
  console.log(
    `[fetch-data] Saved history: ${allAssignments.length} total assignments (${freshAssignments.length} fresh, ${allAssignments.length - freshAssignments.length} from history)`
  );

  // Write public/data.json for the static site
  const data = {
    children,
    assignments: allAssignments,
    lastRefreshed: new Date().toISOString(),
  };
  mkdirSync(join(ROOT, "public"), { recursive: true });
  writeFileSync(join(ROOT, "public", "data.json"), JSON.stringify(data));
  console.log(
    `[fetch-data] Wrote public/data.json (${children.length} children, ${allAssignments.length} assignments)`
  );
}

main();
