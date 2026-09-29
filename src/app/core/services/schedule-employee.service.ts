import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { ScheduleEmployeeRequest } from '../../shared/models/schedule-employee.model/schedule-employee-request.model';
import { ScheduleEmployeeResponse } from '../../shared/models/schedule-employee.model/schedule-employee-response.model';

export type { ScheduleEmployeeResponse };

@Injectable({
  providedIn: 'root'
})
export class ScheduleEmployeeService {
  private apiUrl = `${environment.apiUrl}/ScheduleEmployee`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResponse<ScheduleEmployeeResponse[]>> {
    return this.http.get<ApiResponse<ScheduleEmployeeResponse[]>>(`${this.apiUrl}/GetAll`);
  }

  getByScheduleId(scheduleId: number): Observable<ApiResponse<ScheduleEmployeeResponse[]>> {
    return this.http.get<ApiResponse<ScheduleEmployeeResponse[]>>(`${this.apiUrl}/GetBySchedule/${scheduleId}`);
  }

  add(request: ScheduleEmployeeRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request);
  }

  update(id: number, request: ScheduleEmployeeRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request);
  }

  delete(id: number, updatedBy: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}?updatedBy=${updatedBy}`);
  }
}
