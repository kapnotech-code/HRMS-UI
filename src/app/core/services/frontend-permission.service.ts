import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, firstValueFrom } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { PermissionResponse } from '../../shared/models/permission/permission-response';
import { Page } from '../../shared/models/Pag/Page';
import {
  LOCAL_PERMISSION_MATRIX,
  RoleCodes,
  actionKeyForUrl,
  permissionForRoute,
  roleCodeFromRoleId
} from '../../shared/rbac/permission-matrix';

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
  private currentRoleCode: string | null = null;
  private matrixKeys = new Set<string>();
  private initialized = false;
  private permissionsLoaded = false;

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

  getCurrentRoleCode(): string {
    if (this.currentRoleCode) {
      return this.currentRoleCode;
    }
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const code = payload.RoleCode ?? payload.roleCode;
        if (code) {
          this.currentRoleCode = String(code);
          return this.currentRoleCode;
        }
      }
    } catch { }
    const stored = localStorage.getItem('roleCode');
    if (stored) {
      this.currentRoleCode = stored;
      return stored;
    }
    return roleCodeFromRoleId(this.getCurrentRoleId());
  }

  get isAdmin(): boolean {
    const code = this.getCurrentRoleCode();
    return code === RoleCodes.CompanyAdmin || code === RoleCodes.SuperAdmin;
  }

  has(key: string): boolean {
    return this.matrixKeys.has(key);
  }

  initialize(): Observable<boolean> {
    return this.loadMatrix();
  }

  loadMatrix(): Observable<boolean> {
    if (this.permissionsLoaded && this.matrixKeys.size > 0) {
      return of(true);
    }

    return this.http.get<any>(`${this.apiUrl}/Auth/permissions`).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const keys = (data.permissions ?? data.Permissions ?? []) as string[];
        const roleCode = data.roleCode ?? data.RoleCode;
        const roleId = data.roleId ?? data.RoleId;
        this.applyMatrix(keys, roleCode, roleId);
        this.initialized = true;
        this.permissionsLoaded = true;
        return true;
      }),
      catchError(() => {
        this.applyLocalFallback();
        this.initialized = true;
        this.permissionsLoaded = true;
        return of(true);
      }),
      shareReplay(1)
    );
  }

  private applyMatrix(keys: string[], roleCode?: string, roleId?: number): void {
    this.matrixKeys = new Set((keys ?? []).map(k => String(k)));
    if (roleCode) {
      this.currentRoleCode = String(roleCode);
      localStorage.setItem('roleCode', this.currentRoleCode);
    }
    if (roleId) {
      this.currentRoleId = Number(roleId);
    }
    if (this.matrixKeys.size === 0) {
      this.applyLocalFallback();
    }
  }

  private applyLocalFallback(): void {
    const code = this.getCurrentRoleCode() as keyof typeof LOCAL_PERMISSION_MATRIX;
    const keys = LOCAL_PERMISSION_MATRIX[code] ?? LOCAL_PERMISSION_MATRIX.EMPLOYEE;
    this.matrixKeys = new Set(keys);
  }

  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withSlash.toLowerCase();
  }

  getPageIdByUrl(url: string): number | undefined {
    return this.pageUrlMap.get(this.normalizeUrl(url));
  }

  loadPermissionsForRole(roleId: number): Observable<PermissionResponse[]> {
    this.currentRoleId = roleId;
    return this.loadMatrix().pipe(map(() => []));
  }

  async ensureLoaded(): Promise<void> {
    if (this.permissionsLoaded) {
      return;
    }
    await firstValueFrom(this.loadMatrix());
  }

  isAlwaysAllowed(_url: string): boolean {
    return this.permissionsLoaded;
  }

  isPermissionsLoadedForCurrentRole(): boolean {
    return this.permissionsLoaded;
  }

  hasAnyPermissions(): boolean {
    return this.matrixKeys.size > 0;
  }

  canAddByUrl(url: string): boolean {
    return this.canAdd(url);
  }

  canEditByUrl(url: string): boolean {
    return this.canEdit(url);
  }

  canDeleteByUrl(url: string): boolean {
    return this.canDelete(url);
  }

  hasPermission(pageId: number, action: keyof PermissionResponse = 'canView'): boolean {
    const map = this.permissionsSubject.value;
    const perm = map.get(pageId);
    if (perm) {
      return !!perm[action];
    }
    return this.isAdmin;
  }

  canView(pageIdOrUrl: number | string): boolean {
    if (typeof pageIdOrUrl === 'string') {
      const key = actionKeyForUrl(pageIdOrUrl, 'view');
      return key ? this.has(key) : false;
    }
    return this.hasPermission(pageIdOrUrl, 'canView');
  }

  canAdd(pageIdOrUrl: number | string): boolean {
    if (typeof pageIdOrUrl === 'string') {
      const key = actionKeyForUrl(pageIdOrUrl, 'add');
      return key ? this.has(key) : false;
    }
    return this.hasPermission(pageIdOrUrl, 'canAdd');
  }

  canEdit(pageIdOrUrl: number | string): boolean {
    if (typeof pageIdOrUrl === 'string') {
      const key = actionKeyForUrl(pageIdOrUrl, 'edit');
      return key ? this.has(key) : false;
    }
    return this.hasPermission(pageIdOrUrl, 'canEdit');
  }

  canDelete(pageIdOrUrl: number | string): boolean {
    if (typeof pageIdOrUrl === 'string') {
      const key = actionKeyForUrl(pageIdOrUrl, 'delete');
      return key ? this.has(key) : false;
    }
    return this.hasPermission(pageIdOrUrl, 'canDelete');
  }

  canApprove(pageIdOrUrl: number | string): boolean {
    if (typeof pageIdOrUrl === 'string') {
      const key = actionKeyForUrl(pageIdOrUrl, 'approve');
      return key ? this.has(key) : false;
    }
    return this.hasPermission(pageIdOrUrl, 'canApprove');
  }

  canPrint(pageIdOrUrl: number | string): boolean {
    return this.canView(pageIdOrUrl);
  }

  canExport(pageIdOrUrl: number | string): boolean {
    return this.canView(pageIdOrUrl);
  }

  canAccessRoute(url: string): boolean {
    const normalizedUrl = this.normalizeUrl(url.split('?')[0]);
    if (normalizedUrl === '/dashboard' || normalizedUrl.startsWith('/dashboard/')) {
      return this.has('dashboard.read') || this.permissionsLoaded;
    }
    const key = permissionForRoute(normalizedUrl);
    if (!key) {
      return false;
    }
    return this.has(key);
  }

  clearPermissions(): void {
    this.permissionsSubject.next(new Map());
    this.currentRoleId = null;
    this.currentRoleCode = null;
    this.matrixKeys = new Set();
    this.initialized = false;
    this.permissionsLoaded = false;
    this.pageUrlMap.clear();
    this.allPages = [];
  }
}
