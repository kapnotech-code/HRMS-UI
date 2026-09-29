// employee-shift.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EmployeeShiftRequest,
  EmployeeShiftResponse,
  AddShiftResult,
  ApiMessage
} from '../../shared/models/employeeshift/Employee shift';

const API_BASE = `${environment.apiUrl}/EmployeeShift`;

@Injectable({ providedIn: 'root' })
export class EmployeeShiftService {

  constructor(private http: HttpClient) {}

  // GET api/EmployeeShift
  getAll(): Observable<EmployeeShiftResponse[]> {
    return this.http.get<EmployeeShiftResponse[]>(API_BASE);
  }

  // GET api/EmployeeShift/5
  getById(id: number): Observable<EmployeeShiftResponse> {
    return this.http.get<EmployeeShiftResponse>(`${API_BASE}/${id}`);
  }

  // GET api/EmployeeShift/employee/5
  getByEmployee(employeeId: number): Observable<EmployeeShiftResponse[]> {
    return this.http.get<EmployeeShiftResponse[]>(`${API_BASE}/employee/${employeeId}`);
  }

  // POST api/EmployeeShift
  add(payload: EmployeeShiftRequest): Observable<AddShiftResult> {
    return this.http.post<AddShiftResult>(API_BASE, payload);
  }

  // PUT api/EmployeeShift/5
  update(id: number, payload: EmployeeShiftRequest): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${API_BASE}/${id}`, payload);
  }

  // DELETE api/EmployeeShift/5?hardDelete=false
  delete(id: number, hardDelete: boolean = false): Observable<ApiMessage> {
    const params = new HttpParams().set('hardDelete', hardDelete);
    return this.http.delete<ApiMessage>(`${API_BASE}/${id}`, { params });
  }
}
