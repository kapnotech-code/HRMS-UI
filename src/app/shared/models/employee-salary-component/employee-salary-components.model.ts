export interface EmployeeSalaryComponent {
  esc_Id: number;
  esc_ES_Id: number;
  esc_SC_Id: number;
  esc_CalculationType: string;
  esc_Value: number;
  esc_Amount: number;
  esc_CreatedAt?: string | null;
  esc_UpdatedAt?: string | null;
}

export interface EmployeeSalaryComponentRequest {
  esc_Id?: number;
  esc_ES_Id: number;
  esc_SC_Id: number;
  esc_CalculationType: string;
  esc_Value: number;
  esc_Amount: number;
}
