// Backend ke Common.Model.Common.ApiResponse<T> se match karta hai
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}
