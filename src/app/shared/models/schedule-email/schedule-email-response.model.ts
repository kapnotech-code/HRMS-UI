// models/schedule-email-response.model.ts

// ============================================================
// RESPONSE — casing matches backend's JSON output exactly
// (ASP.NET Core lowercases only the first letter of each C#
// property: SE_EmailId -> sE_EmailId). Confirmed from the live
// GetAll response.
//
// NOTE: the live response does NOT include an SE_CreatedAt
// field — only sE_SentAt (populated once the email is actually
// sent) is present. If a "scheduled date" is needed, the backend
// needs to add that column/field; until then this model omits
// SE_CreatedAt rather than referencing a field that doesn't exist.
// ============================================================
export interface ScheduleEmailResponse {
  sE_EmailId: number;
  sE_ST_Id: number;
  sE_ToEmail: string;
  sE_CCEmail?: string | null;
  sE_Subject: string;
  sE_Body?: string | null;
  sE_EmailType: string;
  sE_Status: string;
  sE_SentAt?: string | null;
  sE_ErrorMessage?: string | null;
}

// ============================================================
// REQUEST — case-insensitively bound by ASP.NET Core, so casing
// here doesn't affect correctness, but aligned to sE_ for
// consistency with the response model.
// ============================================================
