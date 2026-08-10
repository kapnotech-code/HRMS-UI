import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { LeaveRequest, LeaveResponse } from '../../shared/models/Leave/leaverequest/leaverequest';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class LeaveRequestService {
  private apiUrl = `${environment.apiUrl}/LeaveRequest`;
  constructor(private http: HttpClient) { }
  add(request: LeaveRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}`, request);
  }
  update(id: number, request: LeaveRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, request);
  }
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
  getByEmployee(employeeId: number): Observable<ApiResponse<LeaveResponse[]>> {
    return this.http.get<ApiResponse<LeaveResponse[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }
  getPendingApprovals(): Observable<ApiResponse<LeaveResponse[]>> {
    return this.http.get<ApiResponse<LeaveResponse[]>>(`${this.apiUrl}/pending`);
  }
  approveOrReject(id: number, status: 'Approved' | 'Rejected', approvedBy: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${id}/approve-reject?status=${status}&approvedBy=${approvedBy}`,
      null
    );
  }
  cancel(id: number, employeeId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${id}/cancel?employeeId=${employeeId}`,
      null
    );
  }
}
