import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { environment } from '../../../environments/environment';
import {
  AttendanceResponse,
  AttendanceRequest,
  CheckInRequest,
  CheckOutRequest,
  ApplyLeaveRequest,
  ActionLeaveRequest,
  MarkAbsenteesRequest
} from '../../shared/models/Attendance/AttendanceRequest/attendanceRequest';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/Attendance`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResponse<AttendanceResponse[]>> {
    return this.http.get<ApiResponse<AttendanceResponse[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<AttendanceResponse>> {
    return this.http.get<ApiResponse<AttendanceResponse>>(`${this.apiUrl}/${id}`);
  }

  getByEmployee(employeeId: number): Observable<ApiResponse<AttendanceResponse[]>> {
    return this.http.get<ApiResponse<AttendanceResponse[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }

  add(request: AttendanceRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, request);
  }

  update(id: number, request: AttendanceRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number, hardDelete: boolean = false): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}?hardDelete=${hardDelete}`);
  }

  checkIn(request: CheckInRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/CheckIn`, request);
  }

  checkOut(request: CheckOutRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/CheckOut`, request);
  }

  applyLeave(request: ApplyLeaveRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/ApplyLeave`, request);
  }

  actionLeaveRequest(request: ActionLeaveRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/ActionLeaveRequest`, request);
  }

  markAbsentees(request: MarkAbsenteesRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/MarkAbsentees`, request);
  }
}
