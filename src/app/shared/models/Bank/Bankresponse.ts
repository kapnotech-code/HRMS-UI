export interface BankResponse {
  bankID: number;
  bankName: string;
  branchName?: string;
  ifscCode?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive: boolean;
  createdDate?: string;
  modifiedDate?: string;
}
