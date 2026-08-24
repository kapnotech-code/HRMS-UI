// Matches: common.model.Models.EmployeeSalary.EmployeeSalaryResponseModel
export interface EmployeeSalaryResponseModel {
  es_Id: number;
  es_EmployeeId: number;
  es_SS_Id: number;
  es_EffectiveFrom: string;   // ISO date string
  es_EffectiveTo: string | null;
  es_BasicSalary: number;
  es_AnnualCTC: number | null;
  es_MonthlyGross: number | null;
  es_CompanyId: number;
  es_IsActive: boolean;
  es_CreatedAt: string | null;
  es_UpdatedAt: string | null;
}

// Matches: common.model.Models.EmployeeSalary.EmployeeSalaryRequestModel
export interface EmployeeSalaryRequestModel {
  es_Id: number;
  es_EmployeeId: number;
  es_SS_Id: number;
  es_EffectiveFrom: string;
  es_EffectiveTo: string | null;
  es_CompanyId: number;
  es_BasicSalary: number;

  es_AnnualCTC: number | null;
  es_MonthlyGross: number | null;
  es_IsActive: boolean;
}

// Matches: Common.Model.Common.ApiResponse<T>
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}
