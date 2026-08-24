import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { PermissionService } from '../../core/services/permission.service';
import { MenuService } from '../../core/services/menu.service';
import { Menu } from '../../shared/models/Menu/menu.model';

interface PermissionRow {
  permissionId?: number;
  roleId: number;
  pageId: number;
  pageName: string;
  menuGroup: string;
  menuId: number | null;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
  canExport: boolean;
}

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-matrix.component.html',
  styleUrls: ['./permission-matrix.component.css']
})
export class PermissionList implements OnInit, OnDestroy {
  roles: any[] = [];
  pages: any[] = [];
  permissions: PermissionRow[] = [];
  selectedRoleId: number = 0;

  groupedPermissions: { [group: string]: PermissionRow[] } = {};
  menuOrder: string[] = [];

  expandedGroups: { [group: string]: boolean } = {};

  loadingInitial = true;
  loadingPermissions = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();
  private roleSwitch$ = new Subject<void>();
  private menuMap = new Map<number | null | undefined, string>();
  private menuDisplayOrder: { menuId: number | null | undefined; name: string }[] = [];

  constructor(
    private permissionService: PermissionService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.roleSwitch$.next();
    this.roleSwitch$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialData(): void {
    this.loadingInitial = true;
    this.errorMessage = '';

    forkJoin({
      roles: this.permissionService.getRoles().pipe(
        catchError(err => {
          console.error('Roles load nahi hue:', err);
          return of(null);
        })
      ),
      pages: this.permissionService.getPages().pipe(
        catchError(err => {
          console.error('Pages load nahi hue:', err);
          return of(null);
        })
      ),
      menus: this.menuService.getAll().pipe(
        catchError(() => of([]))
      )
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingInitial = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(({ roles, pages, menus }) => {
        if (roles === null || pages === null) {
          this.errorMessage = 'Failed to load Roles or Pages. Please check backend connection.';
          return;
        }

        this.roles = (roles as any).data || roles || [];
        this.pages = ((pages as any).data || pages || []).filter((p: any) => p.isActive !== false);
        this.buildMenuMap(menus as Menu[]);

        if (this.roles.length === 0) {
          this.errorMessage = 'No roles found. Please add roles first.';
        } else if (this.pages.length === 0) {
          this.errorMessage = 'No pages found. Please add pages in Page Master first.';
        }

        this.cdr.detectChanges();
      });
  }

  private buildMenuMap(menus: Menu[]): void {
    this.menuMap.clear();
    this.menuDisplayOrder = [];

    const activeMenus = menus
      .filter(m => m.isActive !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    for (const menu of activeMenus) {
      this.menuMap.set(menu.menuId, menu.menuName);
      this.menuDisplayOrder.push({ menuId: menu.menuId, name: menu.menuName });
    }

    this.menuMap.set(null, 'Other');
    this.menuDisplayOrder.push({ menuId: null, name: 'Other' });
  }

  private getMenuName(menuId: number | null | undefined): string {
    if (!menuId && menuId !== 0) return 'Other';
    return this.menuMap.get(menuId) || 'Other';
  }

  getRoleName(roleId: number): string {
    const role = this.roles.find(r => r.roleId === roleId);
    return role ? role.roleName : `Role-${roleId}`;
  }

  trackByRoleId(_index: number, role: any): number {
    return role.roleId;
  }

  trackByPageId(_index: number, row: PermissionRow): number {
    return row.pageId;
  }

  buildGroupedPermissions(): void {
    this.groupedPermissions = {};
    this.menuOrder = [];

    this.permissions.forEach(row => {
      const group = row.menuGroup || 'Other';
      if (!this.groupedPermissions[group]) {
        this.groupedPermissions[group] = [];
      }
      this.groupedPermissions[group].push(row);
    });

    this.menuOrder = Object.keys(this.groupedPermissions).sort((a, b) => {
      const indexA = this.menuDisplayOrder.findIndex(m => m.name === a);
      const indexB = this.menuDisplayOrder.findIndex(m => m.name === b);
      return indexA - indexB;
    });

    this.expandedGroups = {};
    this.menuOrder.forEach(group => {
      this.expandedGroups[group] = false;
    });
  }

  get groupNames(): string[] {
    return this.menuOrder;
  }

  toggleGroup(group: string): void {
    this.expandedGroups[group] = !this.expandedGroups[group];
  }

  viewCount(group: string): number {
    return (this.groupedPermissions[group] || []).filter(p => p.canView).length;
  }

  expandAll(): void {
    this.groupNames.forEach(g => this.expandedGroups[g] = true);
  }

  collapseAll(): void {
    this.groupNames.forEach(g => this.expandedGroups[g] = false);
  }

  loadPermissions(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.permissions = [];
    this.groupedPermissions = {};
    this.expandedGroups = {};

    this.roleSwitch$.next();

    if (this.selectedRoleId === 0) {
      return;
    }

    if (this.pages.length === 0) {
      this.errorMessage = 'No pages available.';
      return;
    }

    this.loadingPermissions = true;
    const requestedRoleId = this.selectedRoleId;

    this.permissionService.getPermissions(requestedRoleId)
      .pipe(
        takeUntil(this.roleSwitch$),
        takeUntil(this.destroy$),
        finalize(() => {
          if (this.selectedRoleId === requestedRoleId) {
            this.loadingPermissions = false;
          }
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          const existing = res.data || res || [];
          this.permissions = this.pages.map((page: any) => {
            const match = existing.find((x: any) => x.pageId === page.pageId);
            return {
              permissionId: match?.permissionId,
              roleId: requestedRoleId,
              pageId: page.pageId,
              pageName: page.pageName,
              menuGroup: this.getMenuName(page.menuId) || 'Other',
              menuId: page.menuId ?? null,
              canView: match?.canView ?? false,
              canAdd: match?.canAdd ?? false,
              canEdit: match?.canEdit ?? false,
              canDelete: match?.canDelete ?? false,
              canApprove: match?.canApprove ?? false,
              canPrint: match?.canPrint ?? false,
              canExport: match?.canExport ?? false
            };
          });
          this.buildGroupedPermissions();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Permissions load nahi hue:', err);
          this.permissions = this.pages.map((page: any) => ({
            permissionId: undefined,
            roleId: requestedRoleId,
            pageId: page.pageId,
            pageName: page.pageName,
            menuGroup: this.getMenuName(page.menuId) || 'Other',
            menuId: page.menuId ?? null,
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canApprove: false,
            canPrint: false,
            canExport: false
          }));
          this.buildGroupedPermissions();
          this.cdr.detectChanges();
        }
      });
  }

  toggleAll(row: PermissionRow, value: boolean): void {
    row.canView = value;
    row.canAdd = value;
    row.canEdit = value;
    row.canDelete = value;
    row.canApprove = value;
    row.canPrint = value;
    row.canExport = value;
  }

  toggleGroupView(group: string, value: boolean): void {
    (this.groupedPermissions[group] || []).forEach(row => {
      row.canView = value;
    });
  }

  savePermissions(): void {
    if (this.selectedRoleId === 0) {
      alert('Please select a role first.');
      return;
    }
    if (this.permissions.length === 0) {
      alert('No permissions to save.');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const requests: Observable<any>[] = this.permissions.map(p =>
      this.permissionService.save(p)
    );

    forkJoin(requests)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          const roleName = this.getRoleName(this.selectedRoleId);
          this.successMessage = `Permissions saved successfully for ${roleName}.`;
          this.loadPermissions();
        },
        error: (err) => {
          console.error('Save failed:', err);
          this.errorMessage = 'Failed to save some permissions. Please try again.';
          this.cdr.detectChanges();
        }
      });
  }
}