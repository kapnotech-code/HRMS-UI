import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, firstValueFrom } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { PermissionResponse } from '../../shared/models/permission/permission-response';
import { Page } from '../../shared/models/Pag/Page';

@Injectable({
  providedIn: 'root'
})
export class FrontendPermissionService {
  private readonly apiUrl = environment.apiUrl;

  private permissionsSubject = new BehaviorSubject<Map<number, PermissionResponse>>(new Map());
  public readonly permissions$ = this.permissionsSubject.asObservable();

  private pageUrlMap = new Map<string, number>();
  private allPages: Page[] = [];
  private currentRoleId: number | null = null;
  private initialized = false;
  private permissionsLoaded = false;

  // Role 1 = Admin, matches the backend's IsLoggedInUserAdmin() check
  private readonly ADMIN_ROLE_ID = 1;

  // Known routes that should be accessible even if not yet in Page table
  private readonly knownRoutes = new Set<string>([
    '/transactions/schedule-transaction',
    '/transactions/schedule-transaction/',
    '/transactions/schedule-employee',
    '/transactions/schedule-employee/',
    '/masters/schedule-employee',
    '/masters/schedule-employee/',
    '/masters/schedule-master',
    '/masters/schedule-master/',
    '/transactions/schedule-email',
    '/transactions/schedule-email/',
    '/transactions/yearly-paid',
    '/transactions/yearly-paid/'
  ]);

  constructor(private http: HttpClient) { }

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
    } catch { }
    const storedRoleId = localStorage.getItem('roleId');
    if (storedRoleId) {
      this.currentRoleId = Number(storedRoleId);
      return this.currentRoleId;
    }
    return null;
  }

  // ===================================================
  // isAdmin — used by components to branch UI/logic for
  // the Admin role without re-decoding the token themselves.
  // ===================================================
  get isAdmin(): boolean {
    return this.getCurrentRoleId() === this.ADMIN_ROLE_ID;
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

  // ===================================================
  // ensureLoaded — used by components on init:
  //   this.permissionService.ensureLoaded().then(() => ...)
  // Resolves once pages + role permissions are both loaded.
  // Safe to call repeatedly; only loads once.
  // ===================================================
  async ensureLoaded(): Promise<void> {
    if (this.permissionsLoaded) {
      return;
    }

    if (!this.initialized) {
      await firstValueFrom(this.initialize());
    }

    const roleId = this.getCurrentRoleId();
    if (roleId && !this.permissionsLoaded) {
      await firstValueFrom(this.loadPermissionsForRole(roleId));
    } else {
      this.permissionsLoaded = true;
    }
  }

  // ===================================================
  // isAlwaysAllowed — lets a component skip waiting on
  // ensureLoaded() when permissions are already resolved,
  // or when the current user is an Admin (Admin bypasses
  // page-level permission checks the same way the backend does).
  // ===================================================
  isAlwaysAllowed(_url: string): boolean {
    return this.isAdmin || this.permissionsLoaded;
  }

  isPermissionsLoadedForCurrentRole(): boolean {
    return this.permissionsLoaded;
  }

  hasAnyPermissions(): boolean {
    return this.isAdmin || this.permissionsSubject.value.size > 0;
  }

  // ===================================================
  // Resolve a pageId from either a numeric id or a route URL.
  // ===================================================
  private resolvePageId(pageIdOrUrl: number | string): number | undefined {
    if (typeof pageIdOrUrl === 'number') {
      return pageIdOrUrl;
    }
    return this.getPageIdByUrl(pageIdOrUrl);
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
    if (this.isAdmin) return true;

    const map = this.permissionsSubject.value;
    const perm = map.get(pageId);
    if (!perm) return false;
    return !!perm[action];
  }

  // canView / canAdd / canEdit / canDelete / canApprove / canPrint / canExport
  // all accept either a numeric pageId OR a route URL string, so existing
  // callers using PAGE_ROUTE strings keep working without changes.

  canView(pageIdOrUrl: number | string): boolean {
    const pageId = this.resolvePageId(pageIdOrUrl);
    if (pageId === undefined) return !this.permissionsLoaded || this.isAdmin;
    return this.hasPermission(pageId, 'canView');
  }

  canAdd(pageIdOrUrl: number | string): boolean {
    const pageId = this.resolvePageId(pageIdOrUrl);
    if (pageId === undefined) return this.isAdmin;
    return this.hasPermission(pageId, 'canAdd');
  }

  canEdit(pageIdOrUrl: number | string): boolean {
    const pageId = this.resolvePageId(pageIdOrUrl);
    if (pageId === undefined) return this.isAdmin;
    return this.hasPermission(pageId, 'canEdit');
  }

  canDelete(pageIdOrUrl: number | string): boolean {
    const pageId = this.resolvePageId(pageIdOrUrl);
    if (pageId === undefined) return this.isAdmin;
    return this.hasPermission(pageId, 'canDelete');
  }

  canApprove(pageIdOrUrl: number | string): boolean {
    const pageId = this.resolvePageId(pageIdOrUrl);
    if (pageId === undefined) return this.isAdmin;
    return this.hasPermission(pageId, 'canApprove');
  }

  canPrint(pageIdOrUrl: number | string): boolean {
    const pageId = this.resolvePageId(pageIdOrUrl);
    if (pageId === undefined) return this.isAdmin;
    return this.hasPermission(pageId, 'canPrint');
  }

  canExport(pageIdOrUrl: number | string): boolean {
    const pageId = this.resolvePageId(pageIdOrUrl);
    if (pageId === undefined) return this.isAdmin;
    return this.hasPermission(pageId, 'canExport');
  }

  canAccessRoute(url: string): boolean {
    if (this.isAdmin) return true;

    const normalizedUrl = this.normalizeUrl(url);

    // Allow known routes even if not in Page table yet (exact or prefix match)
    for (const knownRoute of this.knownRoutes) {
      if (normalizedUrl === knownRoute || normalizedUrl.startsWith(knownRoute + '/')) {
        return true;
      }
    }

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
