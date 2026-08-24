export interface PayrollAdjustmentResponse {
  pa_Id: number;
  pa_PR_Id: number;
  pa_AdjustmentType: string;
  pa_AdjustmentName: string;
  pa_AdjustmentCategory: string;
  pa_Amount: number;
  pa_Reason?: string;
  pa_CreatedBy: number;
  pa_CreatedAt?: string;
}

export interface PayrollAdjustmentRequest {
  pa_Id?: number;
  pa_PR_Id: number;
  pa_AdjustmentType: string;
  pa_AdjustmentName: string;
  pa_AdjustmentCategory: string;
  pa_Amount: number;
  pa_Reason?: string;
  pa_CreatedBy: number;
}

export interface PayrollAdjustmentApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
