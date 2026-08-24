import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserRequest } from '../../shared/models/User/UserRequest';
import { ResetPasswordRequest } from '../../shared/models/ResetPasswordRequest/ResetPasswordRequest';
import { UserResponse } from '../../shared/models/User/userresponse';
import { ApiResponse } from '../../shared/models/User/ApiResponse';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}/Users`;

  constructor(private http: HttpClient) { }

  getAll(search?: string): Observable<UserResponse[]> {
    const url = search ? `${this.baseUrl}?search=${encodeURIComponent(search)}` : this.baseUrl;
    return this.http
      .get<ApiResponse<UserResponse[]>>(url)
      .pipe(map((res: ApiResponse<UserResponse[]>) => res.data));
  }

  getById(id: number): Observable<UserResponse> {
    return this.http
      .get<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map((res: ApiResponse<UserResponse>) => res.data));
  }

  getByLoginName(loginName: string): Observable<UserResponse> {
    return this.http
      .get<ApiResponse<UserResponse>>(`${this.baseUrl}/login/${loginName}`)
      .pipe(map((res: ApiResponse<UserResponse>) => res.data));
  }

  create(request: UserRequest): Observable<{ userId: number }> {
    return this.http
      .post<ApiResponse<{ userId: number }>>(this.baseUrl, request)
      .pipe(map((res: ApiResponse<{ userId: number }>) => res.data));
  }

  update(id: number, request: UserRequest, isActive: boolean = true): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(
      `${this.baseUrl}/${id}?isActive=${isActive}`,
      request
    );
  }

  resetPassword(id: number, request: ResetPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.baseUrl}/${id}/reset-password`, request);
  }

  setActive(id: number, isActive: boolean): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(
      `${this.baseUrl}/${id}/status?isActive=${isActive}`,
      {}
    );
  }

  unlock(id: number): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.baseUrl}/${id}/unlock`, {});
  }

  recordFailedLogin(id: number): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.baseUrl}/${id}/failed-login`, {});
  }

  recordSuccessfulLogin(id: number, deviceId?: string): Observable<ApiResponse<null>> {
    const url = deviceId
      ? `${this.baseUrl}/${id}/success-login?deviceId=${encodeURIComponent(deviceId)}`
      : `${this.baseUrl}/${id}/success-login`;
    return this.http.put<ApiResponse<null>>(url, {});
  }
  delete(userId: number) {
    return this.http.delete(`${this.baseUrl}/${userId}`);
  }
}
