export interface PermissionRequest {

  roleId: number;

  pageId: number;

  canView: boolean;

  canAdd: boolean;

  canEdit: boolean;

  canDelete: boolean;

  canApprove: boolean;

  canPrint: boolean;

  canExport: boolean;

}
