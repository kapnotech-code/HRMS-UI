export interface UserResponse {
  userId: number;
  userName: string;
  loginUserId: string;
  loginName: string;
  email: string;
  roleId: number;
  createdDate: string;
  updatedDate?: string;
  failedLoginCount: number;
  isLocked: boolean;
  deviceId?: string;
}

