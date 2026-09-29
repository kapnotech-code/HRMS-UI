import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { ScheduleTransactionRequest, ScheduleTransactionStatusRequest } from '../../shared/models/schedule-transaction/schedule-transaction-request.model';
import { ScheduleTransactionResponse } from '../../shared/models/schedule-transaction/schedule-transaction-response.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleTransactionService {
  private apiUrl = `${environment.apiUrl}/ScheduleTransaction`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResponse<ScheduleTransactionResponse[]>> {
    return this.http.get<ApiResponse<ScheduleTransactionResponse[]>>(`${this.apiUrl}/GetAll`);
  }

  getByScheduleEmployeeId(scheduleEmployeeId: number): Observable<ApiResponse<ScheduleTransactionResponse[]>> {
    return this.http.get<ApiResponse<ScheduleTransactionResponse[]>>(`${this.apiUrl}/GetByScheduleEmployee/${scheduleEmployeeId}`);
  }

  add(request: ScheduleTransactionRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request);
  }

  update(id: number, request: ScheduleTransactionRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request);
  }

  delete(id: number, updatedBy: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}?updatedBy=${updatedBy}`);
  }

  updateStatus(request: ScheduleTransactionStatusRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/UpdateStatus`, request);
  }
}