export interface DocumentsResponse {
  documentId: number;
  documentTypeId: number;
  documentTitle: string;
  description?: string | null;
  moduleName: string;
  referenceId: number;
  originalFileName?: string | null;
  storedFileName?: string | null;
  filePath?: string | null;
  fileExtension?: string | null;
  fileSizeKB?: number | null;
  versionNo: number;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  isConfidential: boolean;
  status: string;
  uploadedBy?: number | null;
  uploadedDate: string;
}
