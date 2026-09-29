import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest } from '../../shared/models/Login/LoginRequest';
import { LoginResponse } from '../../shared/models/Login/loginresponse';
import { RegisterRequest } from '../../shared/Register/Registerrequest';
import { FrontendPermissionService } from '../services/frontend-permission.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Auth`;

  constructor(
    private http: HttpClient,
    private frontendPerm: FrontendPermissionService
  ) { }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request);
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, request);
  }

  saveToken(token: string, roleId?: number) {
    localStorage.setItem('token', token);
    if (roleId) { localStorage.setItem('roleId', String(roleId)); }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      // Agar token JWT format mein nahi hai ya decode fail ho
      return true; // fallback: sirf existence check
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('roleId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('departmentId');
    localStorage.removeItem('departmentName');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyName');
    this.frontendPerm.clearPermissions();
  }

  /**
   * Reads the current user. Base identity fields (userId, email, roleId,
   * firstName/lastName) come from the JWT claims, which are safe to trust
   * because they are still covered by the token's original signature.
   *
   * companyId/companyName/departmentId/departmentName are read from
   * dedicated localStorage keys instead of the token. These values can
   * change after login (e.g. switching company/department context) and
   * must NEVER be written back into the JWT payload on the client -
   * doing so invalidates the token's signature (the server signs
   * header+payload together; editing the payload without re-signing
   * makes every subsequent API call fail with a 401 / IDX10517
   * "Signature validation failed").
   *
   * If you need the token itself to carry updated company/department
   * claims, call a backend endpoint that issues a freshly-signed token
   * with the new claims - never edit the token client-side.
   */
  getCurrentUser(): any {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));

        const storedCompanyId = localStorage.getItem('companyId');
        const storedCompanyName = localStorage.getItem('companyName');
        const storedDepartmentId = localStorage.getItem('departmentId');
        const storedDepartmentName = localStorage.getItem('departmentName');
        const storedUserName = localStorage.getItem('userName');
        const storedRoleId = localStorage.getItem('roleId');

        return {
          userId: payload.userId ?? payload.UserId ?? payload.nameid ?? payload.NameId,
          email: payload.email ?? payload.Email,
          roleId: storedRoleId != null
            ? Number(storedRoleId)
            : (payload.roleId ?? payload.RoleId),
          firstName: payload.firstName ?? payload.FirstName,
          lastName: payload.lastName ?? payload.LastName,
          userName: storedUserName ?? payload.userName ?? payload.UserName,
          departmentId: storedDepartmentId != null
            ? Number(storedDepartmentId)
            : (payload.departmentId ?? payload.DepartmentId ?? payload.departmentID ?? payload.DepartmentID ?? null),
          departmentName: storedDepartmentName ?? (payload.departmentName ?? payload.DepartmentName ?? payload.department ?? payload.Department ?? null),
          companyId: storedCompanyId != null
            ? Number(storedCompanyId)
            : (payload.companyId ?? payload.CompanyId ?? null),
          companyName: storedCompanyName ?? (payload.companyName ?? payload.CompanyName ?? null),
          employeeId: payload.employeeId ?? payload.EmployeeID ?? payload.EmployeeId ?? null
        };
      }
    } catch { }
    return null;
  }

  /** Convenience accessor - returns the CompanyId from the JWT, or null if the
   *  logged-in account has no company linked (e.g. a platform/super admin). */
  getCompanyId(): number | null {
    const user = this.getCurrentUser();
    return user?.companyId != null ? Number(user.companyId) : null;
  }

  /** Convenience accessor - returns the EmployeeId from the JWT. */
  getEmployeeId(): number | null {
    const user = this.getCurrentUser();
    return user?.employeeId != null ? Number(user.employeeId) : null;
  }

  /**
   * Persist user context (company/department/etc.) for use across the app.
   *
   * IMPORTANT: this stores values in dedicated localStorage keys only.
   * It deliberately does NOT modify the JWT token. Editing a JWT's
   * payload client-side breaks its signature (the signature is computed
   * over header+payload by the server using a secret key the client
   * doesn't have), which causes every following API call to fail
   * authentication with a 401.
   */
  saveCurrentUser(user: any): void {
    if (!user) return;

    if (user.userId != null) localStorage.setItem('userId', String(user.userId));
    if (user.roleId != null) localStorage.setItem('roleId', String(user.roleId));
    if (user.userName) localStorage.setItem('userName', user.userName);

    if (user.departmentId != null) {
      localStorage.setItem('departmentId', String(user.departmentId));
    } else {
      localStorage.removeItem('departmentId');
    }

    if (user.departmentName) {
      localStorage.setItem('departmentName', user.departmentName);
    } else {
      localStorage.removeItem('departmentName');
    }

    if (user.companyId != null) {
      localStorage.setItem('companyId', String(user.companyId));
    } else {
      localStorage.removeItem('companyId');
    }

    if (user.companyName) {
      localStorage.setItem('companyName', user.companyName);
    } else {
      localStorage.removeItem('companyName');
    }
  }

  /** Extract DepartmentId / DepartmentName for the current user. */
  getDepartmentFromClaims(): { departmentId: number | null; departmentName: string | null } {
    const user = this.getCurrentUser();
    return {
      departmentId: user?.departmentId != null ? Number(user.departmentId) : null,
      departmentName: user?.departmentName != null ? String(user.departmentName) : null
    };
  }

  /** Decode the roleId claim from the JWT payload. */
  decodeRoleIdFromJwt(token: string): number | null {
    try {
      const parts = String(token ?? '').split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1].replace(/=/g, '')));
      const roleId = payload.roleId ?? payload.RoleId;
      return roleId == null ? null : Number(roleId);
    } catch {
      return null;
    }
  }
}
