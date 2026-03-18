#!/usr/bin/env node

/**
 * Standalone script to fetch ParentVUE data and write public/data.json.
 * Runs in GitHub Actions before `next build`.
 *
 * Required env vars: PARENTVUE_URL, PARENTVUE_USERNAME, PARENTVUE_PASSWORD
 * Optional: PARENTVUE_MAX_CHILDREN (default 5)
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseString } from "xml2js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SOAP_ACTION = "http://edupoint.com/webservices/ProcessWebServiceRequest";
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

function buildSoapEnvelope(methodName, paramStr) {
  const encoded = paramStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
      <userID>${USERNAME}</userID>
      <password>${PASSWORD}</password>
      <skipLoginLog>1</skipLoginLog>
      <parent>1</parent>
      <webServiceHandleName>PXPWebServices</webServiceHandleName>
      <methodName>${methodName}</methodName>
      <paramStr>${encoded}</paramStr>
    </ProcessWebServiceRequest>
  </soap:Body>
</soap:Envelope>`;
}

async function callParentVue(methodName, childIntID) {
  const endpoint = `${BASE_URL}/Service/PXPCommunication.asmx`;
  const paramStr = `<Parms><ChildIntID>${childIntID}</ChildIntID></Parms>`;
  const envelope = buildSoapEnvelope(methodName, paramStr);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: SOAP_ACTION,
    },
    body: envelope,
  });

  if (!response.ok) {
    throw new Error(`ParentVUE HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

function extractResponseXml(soapResponse) {
  const match = soapResponse.match(
    /<ProcessWebServiceRequestResult>([\s\S]*?)<\/ProcessWebServiceRequestResult>/
  );
  if (!match) throw new Error("Could not extract result from SOAP response");
  return match[1]
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseXml(xmlStr) {
  return new Promise((resolve, reject) => {
    parseString(xmlStr, { explicitArray: true, strict: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function toISO(dateStr) {
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeType(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes("test") || lower.includes("exam") || lower.includes("final")) return "test";
  if (lower.includes("quiz")) return "quiz";
  if (lower.includes("project") || lower.includes("essay")) return "project";
  if (lower.includes("homework") || lower.includes("hw")) return "homework";
  return "other";
}

async function parseStudentInfo(soapResponse) {
  const xmlStr = extractResponseXml(soapResponse);
  const parsed = await parseXml(xmlStr);
  const student = parsed?.STUDENTINFO;
  if (!student) {
    const root = parsed ? Object.values(parsed)[0] : null;
    const errMsg = root?.$?.ERRORMESSAGE ?? root?.$?.RT_ERROR;
    if (errMsg) throw new Error(String(errMsg));
    throw new Error("Invalid student info response");
  }
  const fullName = `${student.FIRSTNAME?.[0] ?? ""} ${student.LASTNAME?.[0] ?? ""}`.trim();
  const name = student.FORMATTEDNAME?.[0] ?? (fullName || "Student");
  const grade = student.GRADE?.[0] ?? "";
  return { name, grade };
}

async function parseGradebook(soapResponse, childName, childColor) {
  const xmlStr = extractResponseXml(soapResponse);
  const parsed = await parseXml(xmlStr);
  const gradebook = parsed?.GRADEBOOK;
  if (!gradebook) return [];
  if (gradebook.$?.ERRORMESSAGE) throw new Error(gradebook.$.ERRORMESSAGE);

  const courses = gradebook?.COURSES?.[0]?.COURSE ?? [];
  const assignments = [];

  for (const course of courses) {
    const courseName = course.$?.TITLE ?? "Unknown";
    const marks = course?.MARKS?.[0]?.MARK ?? [];
    for (const mark of marks) {
      const rawAssignments = mark?.ASSIGNMENTS?.[0]?.ASSIGNMENT ?? [];
      for (const a of rawAssignments) {
        if (!a.$?.DUEDATE) continue;
        assignments.push({
          id: a.$.GRADEBOOKID ?? `${courseName}-${a.$.MEASURE}`,
          name: a.$.MEASURE ?? "Untitled",
          course: courseName,
          type: normalizeType(a.$.TYPE ?? ""),
          dueDate: toISO(a.$.DUEDATE),
          assignedDate: a.$.DATE ? toISO(a.$.DATE) : toISO(a.$.DUEDATE),
          score: a.$.SCORE ?? "",
          pointsPossible: a.$.POINTSPOSSIBLE ?? "",
          notes: a.$.NOTES ?? "",
          isNotForGrading: a.$.ISNOTFORGRADING === "true",
          childName,
          childColor,
        });
      }
    }
  }
  return assignments;
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

async function main() {
  console.log("[fetch-data] Starting ParentVUE data fetch...");

  const children = [];
  const allAssignments = [];

  for (let i = 0; i < MAX_CHILDREN; i++) {
    try {
      const infoResponse = await callParentVue("StudentInfo", i);
      const info = await parseStudentInfo(infoResponse);
      const color = CHILD_COLORS[i % CHILD_COLORS.length];

      children.push({
        intID: i,
        name: info.name,
        grade: info.grade,
        color: color.bg,
        lightColor: color.light,
        textColor: color.text,
      });

      const gradebookResponse = await callParentVue("Gradebook", i);
      const assignments = await parseGradebook(gradebookResponse, info.name, color.bg);
      allAssignments.push(...assignments);

      console.log(`[fetch-data] Child ${i} (${info.name}): ${assignments.length} assignments`);
    } catch (err) {
      console.error(`[fetch-data] Error fetching child ${i}:`, err.message);
      if (children.length === 0 && i === 0) {
        console.error("[fetch-data] First child fetch failed — check credentials");
        process.exit(1);
      }
      break;
    }
  }

  const customTasks = loadCustomTasks();
  allAssignments.push(...customTasks);

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
