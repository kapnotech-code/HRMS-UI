import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { environment } from '../../../environments/environment';
import { LeaveTypeResponse } from '../../shared/models/leavetype/leave-type-response/leave-type-response';
import { LeaveTypeRequest } from '../../shared/models/leavetype/leave-type-request';

@Injectable({ providedIn: 'root' })
export class LeaveTypeService {
  private apiUrl = `${environment.apiUrl}/LeaveType`;

  constructor(private http: HttpClient) { }

  // Backend seedha array return karta hai, ApiResponse wrapper nahi
  getAll(): Observable<LeaveTypeResponse[]> {
    return this.http.get<LeaveTypeResponse[]>(this.apiUrl);
  }

  getById(id: number): Observable<LeaveTypeResponse> {
    return this.http.get<LeaveTypeResponse>(`${this.apiUrl}/${id}`);
  }

  add(request: LeaveTypeRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  update(id: number, request: LeaveTypeRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number, hardDelete: boolean = false): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}?hardDelete=${hardDelete}`);
  }
}
