export interface SalaryStructureResponse {
  ss_Id: number;
  ss_StructureName: string;
  ss_PayFrequency: string;
  ss_Description: string;
  ss_IsActive: boolean;
  ss_CreatedAt?: string;
  ss_UpdatedAt?: string;
}

export interface SalaryStructureRequest {
  ss_StructureName: string;
  ss_PayFrequency: string;
  ss_Description: string;
  ss_IsActive: boolean;
}
