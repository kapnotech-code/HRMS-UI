export interface DepartmentResponse {
  departmentID: number;
  departmentCode: string;
  departmentName: string;
  departmentHeadID?: number;
  parentDepartmentID?: number;
  location?: string;
  description?: string;
  budget?: number;
  companyID?: number;
  isActive: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}
