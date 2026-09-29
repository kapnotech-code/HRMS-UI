import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Roles
  getRoles(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/Roles/GetAll`).pipe(
      map(res => (res?.data ?? res ?? []) as any[])
    );
  }

  // Pages
  getPages(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/Page`).pipe(
      map(res => (res?.data ?? res ?? []) as any[])
    );
  }

  // Permissions By Role
  getPermissions(roleId: number): Observable<any[]> {
    return this.http.get<any>(
      `${this.apiUrl}/RolePagePermission/role/${roleId}`
    ).pipe(
      map(res => (res?.data ?? res ?? []) as any[])
    );
  }

  // Save Permission
  save(permission: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/RolePagePermission`,
      permission
    );
  }

  // Update Permission
  update(permission: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/RolePagePermission`,
      permission
    );
  }

  // Delete Permission
  delete(roleId: number, pageId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/RolePagePermission?roleId=${roleId}&pageId=${pageId}`
    );
  }
}
