export interface ScheduleEmailRequest {
  sE_EmailId?: number;
  sE_ST_Id: number;
  sE_ToEmail: string;
  sE_CCEmail?: string;
  sE_Subject: string;
  sE_Body: string;
  sE_EmailType: string;   // ReviewNotification / Reminder / ApprovalNotification / RejectionNotification / CompletionNotification
}
