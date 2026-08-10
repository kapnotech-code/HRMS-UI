export interface CompanyRequest {
  companyID?: number | null;
  companyName: string;
  fromDate?: string | null;
  toDate?: string | null;
  location?: string | null;
  contactPersonName?: string | null;
  contactNumber?: string | null;
  companyLogo?: File | null;
  companyImage?: File | null;
}
