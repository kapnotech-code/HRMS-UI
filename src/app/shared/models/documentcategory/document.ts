export interface DocumentCategory {
  categoryId?: number;
  categoryName: string;
  description?: string;
  isActive: boolean;
  createdBy?: number;
  modifiedBy?: number;
}

export interface DocumentCategoryFilter {
  onlyActive?: boolean;
}
