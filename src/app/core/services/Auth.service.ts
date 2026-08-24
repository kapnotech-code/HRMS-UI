import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest } from '../../shared/models/Login/LoginRequest';
import { LoginResponse } from '../../shared/models/Login/loginresponse';
import { RegisterRequest } from '../../shared/Register/Registerrequest';
import { FrontendPermissionService } from '../services/frontend-permission.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7135/api/Auth';

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
    this.frontendPerm.clearPermissions();
  }
}

