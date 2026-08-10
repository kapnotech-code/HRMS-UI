export interface PermissionResponse {

  roleId: number;
  pageId: number;
  pageName: string;

  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
  canExport: boolean;

}
