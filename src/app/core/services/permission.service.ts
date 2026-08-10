import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private apiUrl = 'https://localhost:7135/api';

  constructor(private http: HttpClient) { }

  // Roles
  getRoles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Roles/GetAll`);
  }

  // Pages
  getPages(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Page`);
  }

  // Permissions By Role
  getPermissions(roleId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/RolePagePermission/role/${roleId}`
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
