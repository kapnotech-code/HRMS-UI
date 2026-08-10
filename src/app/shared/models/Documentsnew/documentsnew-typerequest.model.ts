export interface DocumentTypesRequest {
  documentTypeId: number;
  categoryId: number;
  documentTypeName: string;
  isMandatory: boolean;
  expiryRequired: boolean;
  allowedExtensions?: string | null;
  maxFileSizeMB?: number | null;
  isActive: boolean;
}
export interface DocumentTypesResponse {
  documentTypeId: number;
  categoryId: number;
  documentTypeName: string;
  isMandatory: boolean;
  expiryRequired: boolean;
  allowedExtensions?: string | null;
  maxFileSizeMB?: number | null;
  isActive: boolean;
}
