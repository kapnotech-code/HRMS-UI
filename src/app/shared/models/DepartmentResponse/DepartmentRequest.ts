// shared/models/DepartmentResponse/DepartmentRequest.ts
export interface DepartmentRequest {
  departmentID?: number | null;
  departmentCode: string;
  departmentName: string;
  departmentHeadID?: number | null;
  parentDepartmentID?: number | null;
  location?: string;
  description?: string;
  budget?: number | null;      
  companyID?: number | null;
}
