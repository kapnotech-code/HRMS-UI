export interface PayrollResponse {
  pr_Id: number;
  pr_EmployeeId: number;
  pr_PayrollMonth: number;
  pr_PayrollYear: number;
  pr_WorkingDays: number;
  pr_PresentDays: number;
  pr_PaidLeaveDays: number;
  pr_LOPDays: number;
  pr_TotalEarnings: number;
  pr_TotalDeductions: number;
  pr_GrossSalary: number;
  pr_NetSalary: number;
  pr_Status: string;
  pr_ProcessedDate?: string;
  pr_ApprovedDate?: string;
  pr_CreatedAt?: string;
  pr_UpdatedAt?: string;
}

export interface PayrollRequest {
  pr_Id?: number;
  pr_EmployeeId: number;
  pr_PayrollMonth: number;
  pr_PayrollYear: number;
  pr_WorkingDays: number;
  pr_PresentDays: number;
  pr_PaidLeaveDays: number;
  pr_LOPDays: number;
  pr_TotalEarnings: number;
  pr_TotalDeductions: number;
  pr_GrossSalary: number;
  pr_NetSalary: number;
  pr_Status: string;
  pr_ProcessedDate?: string;
  pr_ApprovedDate?: string;
}

export interface PayrollApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PayrollRazorpayOrderRequest {
  payrollId: number;
  employeeId: number;
  amount: number;
}

export interface PayrollRazorpayOrderResponse {
  success: boolean;
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  payrollId: number;
  employeeId: number;
  message?: string;
}

export interface PayrollRazorpayVerifyRequest {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  payrollId: number;
  employeeId: number;
  amount: number;
  currency: string;
}

export interface PayrollRazorpayVerifyResponse {
  success: boolean;
  message: string;
  paymentId: number;
  paymentStatus: string;
}
