export interface CompanyResponse {
  companyID: number;
  companyName: string;
  fromDate?: string | null;
  toDate?: string | null;
  location?: string | null;
  contactPersonName?: string | null;
  contactNumber?: string | null;
  companyLogo?: string | null;   // ✅ string, not File
  companyImage?: string | null;  // ✅ string, not File
  isActive: boolean;
  createdDate?: string | null;
  modifiedDate?: string | null;
}
