export interface Page {
  pageId?: number;
  pageName: string;
  pageUrl: string;
  displayOrder: number;
  isActive: boolean;

  menuId?: number | null;      // Selected Menu ID
  menuName?: string | null;    // Display Menu Name
}
