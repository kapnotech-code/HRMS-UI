export interface Menu {
  menuId?: number;
  menuName: string;
  parentMenuId?: number | null;
  pageId: number;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuTree {
  menuId: number;
  menuName: string;
  icon: string;
  pageUrl: string;
  displayOrder: number;
  children: MenuTree[];
}
