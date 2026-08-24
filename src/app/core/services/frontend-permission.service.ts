import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { PermissionResponse } from '../../shared/models/permission/permission-response';
import { Page } from '../../shared/models/Pag/Page';

@Injectable({
  providedIn: 'root'
})
export class FrontendPermissionService {
  private readonly apiUrl = 'https://localhost:7135/api';

  private permissionsSubject = new BehaviorSubject<Map<number, PermissionResponse>>(new Map());
  public readonly permissions$ = this.permissionsSubject.asObservable();

  private pageUrlMap = new Map<string, number>();
  private allPages: Page[] = [];
  private currentRoleId: number | null = null;
  private initialized = false;
  private permissionsLoaded = false;

  constructor(private http: HttpClient) {}

  getCurrentRoleId(): number | null {
    if (this.currentRoleId) return this.currentRoleId;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roleId = payload.roleId ?? payload.RoleId;
        if (roleId) {
          this.currentRoleId = Number(roleId);
          return this.currentRoleId;
        }
      }
    } catch {}
    const storedRoleId = localStorage.getItem('roleId');
    if (storedRoleId) {
      this.currentRoleId = Number(storedRoleId);
      return this.currentRoleId;
    }
    return null;
  }

  initialize(): Observable<boolean> {
    if (this.initialized) {
      return of(true);
    }

    const roleId = this.getCurrentRoleId();
    if (!roleId) {
      return of(false);
    }

    return this.http.get<any>(`${this.apiUrl}/Page`).pipe(
      map((res: any) => {
        const pages = (res?.data ?? res ?? []) as Page[];
        this.allPages = pages.filter((p: Page) => p.isActive !== false);
        this.pageUrlMap.clear();
        this.allPages.forEach((p: Page) => {
          if (p.pageUrl) {
            const normalized = this.normalizeUrl(p.pageUrl);
            this.pageUrlMap.set(normalized, p.pageId!);
          }
        });
        this.initialized = true;
        return true;
      }),
      catchError(() => {
        this.initialized = true;
        return of(false);
      }),
      shareReplay(1)
    );
  }

  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withSlash.toLowerCase();
  }

  getPageIdByUrl(url: string): number | undefined {
    if (this.pageUrlMap.size === 0) {
      this.initialize().subscribe();
    }
    return this.pageUrlMap.get(this.normalizeUrl(url));
  }

  loadPermissionsForRole(roleId: number): Observable<PermissionResponse[]> {
    return this.http.get<any>(`${this.apiUrl}/RolePagePermission/role/${roleId}`).pipe(
      map((res: any) => {
        const rawList = (res?.data ?? res ?? []) as any[];
        const list: PermissionResponse[] = rawList.map(p => ({
          roleId: p.roleId ?? p.RoleId ?? roleId,
          pageId: p.pageId ?? p.PageId,
          pageName: p.pageName ?? p.PageName ?? '',
          canView: !!(p.canView ?? p.CanView),
          canAdd: !!(p.canAdd ?? p.CanAdd),
          canEdit: !!(p.canEdit ?? p.CanEdit),
          canDelete: !!(p.canDelete ?? p.CanDelete),
          canApprove: !!(p.canApprove ?? p.CanApprove),
          canPrint: !!(p.canPrint ?? p.CanPrint),
          canExport: !!(p.canExport ?? p.CanExport),
        }));
        const map = new Map<number, PermissionResponse>();
        list.forEach(p => map.set(p.pageId, p));
        this.permissionsSubject.next(map);
        this.currentRoleId = roleId;
        this.initialized = true;
        this.permissionsLoaded = true;
        return list;
      }),
      catchError(() => {
        this.permissionsSubject.next(new Map());
        this.permissionsLoaded = true;
        return of([]);
      })
    );
  }

  canAddByUrl(url: string): boolean {
    const pageId = this.getPageIdByUrl(url);
    if (!pageId) return true;
    return this.canAdd(pageId);
  }

  canEditByUrl(url: string): boolean {
    const pageId = this.getPageIdByUrl(url);
    if (!pageId) return true;
    return this.canEdit(pageId);
  }

  canDeleteByUrl(url: string): boolean {
    const pageId = this.getPageIdByUrl(url);
    if (!pageId) return true;
    return this.canDelete(pageId);
  }

  hasPermission(pageId: number, action: keyof PermissionResponse = 'canView'): boolean {
    const map = this.permissionsSubject.value;
    const perm = map.get(pageId);
    if (!perm) return false;
    return !!perm[action];
  }

  canView(pageId: number): boolean {
    return this.hasPermission(pageId, 'canView');
  }

  canAdd(pageId: number): boolean {
    return this.hasPermission(pageId, 'canAdd');
  }

  canEdit(pageId: number): boolean {
    return this.hasPermission(pageId, 'canEdit');
  }

  canDelete(pageId: number): boolean {
    return this.hasPermission(pageId, 'canDelete');
  }

  canApprove(pageId: number): boolean {
    return this.hasPermission(pageId, 'canApprove');
  }

  canPrint(pageId: number): boolean {
    return this.hasPermission(pageId, 'canPrint');
  }

  canExport(pageId: number): boolean {
    return this.hasPermission(pageId, 'canExport');
  }

  canAccessRoute(url: string): boolean {
    const normalizedUrl = this.normalizeUrl(url);
    let pageId = this.pageUrlMap.get(normalizedUrl);

    if (pageId === undefined) {
      const fallback = this.allPages.find(p => this.normalizeUrl(p.pageUrl) === normalizedUrl);
      pageId = fallback?.pageId;
    }

    if (pageId === undefined) {
      // Check if URL is a sub-route of a known page (e.g. /masters/users/new -> /masters/users)
      for (const [pageUrl, id] of this.pageUrlMap) {
        if (normalizedUrl === pageUrl || normalizedUrl.startsWith(pageUrl + '/')) {
          pageId = id;
          break;
        }
      }
    }
    if (pageId === undefined) {
      return !this.permissionsLoaded;
    }


    const map = this.permissionsSubject.value;
    const perm = map.get(pageId);
    if (!perm) return false;
    return !!perm.canView;
  }

  clearPermissions(): void {
    this.permissionsSubject.next(new Map());
    this.currentRoleId = null;
    this.initialized = false;
    this.permissionsLoaded = false;
    this.pageUrlMap.clear();
    this.allPages = [];
  }
}




