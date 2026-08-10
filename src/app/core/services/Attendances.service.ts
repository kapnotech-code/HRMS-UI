import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { AttendanceRequest, AttendanceResponse } from '../../shared/models/Attendance/AttendanceRequest/attendanceRequest';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  // Controller route: [Route("api/[controller]")] -> api/Attendance
  private apiUrl = `${environment.apiUrl}/Attendance`;

  constructor(private http: HttpClient) { }

  // GET api/Attendance
  getAll(): Observable<ApiResponse<AttendanceResponse[]>> {
    return this.http.get<ApiResponse<AttendanceResponse[]>>(this.apiUrl);
  }


  // GET api/Attendance/{id}
  getById(id: number): Observable<ApiResponse<AttendanceResponse>> {
    return this.http.get<ApiResponse<AttendanceResponse>>(`${this.apiUrl}/${id}`);
  }

  // GET api/Attendance/employee/{employeeId}
  getByEmployee(employeeId: number): Observable<ApiResponse<AttendanceResponse[]>> {
    return this.http.get<ApiResponse<AttendanceResponse[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }

  // POST api/Attendance
  create(data: Partial<AttendanceRequest>): Observable<ApiResponse<AttendanceRequest>> {
    return this.http.post<ApiResponse<AttendanceRequest>>(this.apiUrl, data);
  }

  // PUT api/Attendance/{id}
  update(id: number, data: Partial<AttendanceRequest>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // DELETE api/Attendance/{id}
  delete(id: number, hardDelete: boolean = false): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}?hardDelete=${hardDelete}`);
  }
}
