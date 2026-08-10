import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { LeaveRequest } from '../../shared/models/Leave/leaverequest/leaverequest';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LeaveRequestService {
  private apiUrl = `${environment.apiUrl}/LeaveRequest`;

  constructor(private http: HttpClient) { }

  // POST api/LeaveRequest
  add(request: LeaveRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}`, request);
  }

  // GET api/LeaveRequest/employee/{employeeId}
  getByEmployee(employeeId: number): Observable<ApiResponse<LeaveRequest[]>> {
    return this.http.get<ApiResponse<LeaveRequest[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }

  // GET api/LeaveRequest/pending
  getPendingApprovals(): Observable<ApiResponse<LeaveRequest[]>> {
    return this.http.get<ApiResponse<LeaveRequest[]>>(`${this.apiUrl}/pending`);
  }

  // PUT api/LeaveRequest/{id}/approve-reject?status=Approved&approvedBy=2
  approveOrReject(id: number, status: 'Approved' | 'Rejected', approvedBy: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${id}/approve-reject?status=${status}&approvedBy=${approvedBy}`,
      null
    );
  }

  // PUT api/LeaveRequest/{id}/cancel?employeeId=1
  cancel(id: number, employeeId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${id}/cancel?employeeId=${employeeId}`,
      null
    );
  }
}
