import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { ScheduleEmailRequest } from '../../shared/models/schedule-email/schedule-email-request.model';
import { ScheduleEmailResponse } from '../../shared/models/schedule-email/schedule-email-response.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleEmailService {
  private apiUrl = `${environment.apiUrl}/ScheduleEmail`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResponse<ScheduleEmailResponse[]>> {
    return this.http.get<ApiResponse<ScheduleEmailResponse[]>>(`${this.apiUrl}/GetAll`);
  }

  getByScheduleTransactionId(scheduleTransactionId: number): Observable<ApiResponse<ScheduleEmailResponse[]>> {
    return this.http.get<ApiResponse<ScheduleEmailResponse[]>>(`${this.apiUrl}/GetByScheduleTransaction/${scheduleTransactionId}`);
  }

  add(request: ScheduleEmailRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request);
  }

  update(id: number, request: ScheduleEmailRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request);
  }

  resend(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Resend/${id}`, {});
  }

  delete(id: number, updatedBy: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}?updatedBy=${updatedBy}`);
  }

  send(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Send/${id}`, {});
  }
}