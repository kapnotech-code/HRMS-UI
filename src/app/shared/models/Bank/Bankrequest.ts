export interface BankRequest
{
  bankID?: number;
  bankName: string;
  branchName?: string;
  ifscCode?: string;
  city?: string;
  state?: string;
  country?: string;
}
