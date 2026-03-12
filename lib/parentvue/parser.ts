import { parseStringPromise } from "xml2js";
import type { Assignment, AssignmentType } from "./types";

const XML_OPTS = { explicitArray: true, strict: false };

function extractResponseXml(soapResponse: string): string {
  const match = soapResponse.match(
    /<ProcessWebServiceRequestResult>([\s\S]*?)<\/ProcessWebServiceRequestResult>/
  );
  if (!match) throw new Error("Could not extract result from SOAP response");

  return match[1]
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function toISO(dateStr: string): string {
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeType(raw: string): AssignmentType {
  const lower = raw.toLowerCase();
  if (lower.includes("test") || lower.includes("exam") || lower.includes("final"))
    return "test";
  if (lower.includes("quiz")) return "quiz";
  if (lower.includes("project") || lower.includes("essay")) return "project";
  if (lower.includes("homework") || lower.includes("hw")) return "homework";
  return "other";
}

// With strict:false, xml2js uppercases all tag/attribute names
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function parseGradebook(
  soapResponse: string,
  childName: string,
  childColor: string
): Promise<Assignment[]> {
  const xmlStr = extractResponseXml(soapResponse);
  const parsed = await parseStringPromise(xmlStr, XML_OPTS);

  const gradebook = parsed?.GRADEBOOK;
  if (!gradebook) return [];

  if (gradebook.$?.ERRORMESSAGE) {
    throw new Error(gradebook.$.ERRORMESSAGE);
  }

  const courses: any[] = gradebook?.COURSES?.[0]?.COURSE ?? [];
  const assignments: Assignment[] = [];

  for (const course of courses) {
    const courseName = course.$?.TITLE ?? "Unknown";
    const marks: any[] = course?.MARKS?.[0]?.MARK ?? [];

    for (const mark of marks) {
      const rawAssignments: any[] = mark?.ASSIGNMENTS?.[0]?.ASSIGNMENT ?? [];

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
          childName,
          childColor,
        });
      }
    }
  }

  return assignments;
}

export async function parseStudentInfo(
  soapResponse: string
): Promise<{ name: string; grade: string }> {
  const xmlStr = extractResponseXml(soapResponse);
  const parsed = await parseStringPromise(xmlStr, XML_OPTS);

  const student = parsed?.STUDENTINFO;
  if (!student) {
    const root = parsed ? (Object.values(parsed)[0] as any) : null;
    const errMsg = root?.$?.ERRORMESSAGE ?? root?.$?.RT_ERROR;
    if (errMsg) throw new Error(String(errMsg));
    throw new Error("Invalid student info response");
  }

  const fullName =
    `${student.FIRSTNAME?.[0] ?? ""} ${student.LASTNAME?.[0] ?? ""}`.trim();
  const name = student.FORMATTEDNAME?.[0] ?? (fullName || "Student");

  const grade = student.GRADE?.[0] ?? "";

  return { name, grade };
}
