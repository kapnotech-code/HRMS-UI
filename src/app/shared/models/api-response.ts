//TypeScript generic interface
//API response ka standard structure define karti hai
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}
