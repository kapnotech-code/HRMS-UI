import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaveBalanceRequest, LeaveBalanceResponse } from '../../shared/models/Leave balance.model.ts/Request/Leave balance.model';
import { environment } from '../../../environments/environment'; 

@Injectable({ providedIn: 'root' })
export class LeaveBalanceService {
  private apiUrl = `${environment.apiUrl}/LeaveBalance`;

  constructor(private http: HttpClient) { }

  // GET api/LeaveBalance
  getAll(): Observable<LeaveBalanceResponse[]> {
    return this.http.get<LeaveBalanceResponse[]>(`${this.apiUrl}`);
  }

  // GET api/LeaveBalance/{id}
  getById(id: number): Observable<LeaveBalanceResponse> {
    return this.http.get<LeaveBalanceResponse>(`${this.apiUrl}/${id}`);
  }

  // GET api/LeaveBalance/employee/{employeeId}
  getByEmployee(employeeId: number): Observable<LeaveBalanceResponse[]> {
    return this.http.get<LeaveBalanceResponse[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  // POST api/LeaveBalance
  add(balance: LeaveBalanceRequest): Observable<LeaveBalanceResponse> {
    return this.http.post<LeaveBalanceResponse>(`${this.apiUrl}`, balance);
  }

  // PUT api/LeaveBalance/{id}
  update(id: number, balance: LeaveBalanceRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, balance);
  }

  // DELETE api/LeaveBalance/{id}?hardDelete=false
  delete(id: number, hardDelete = false): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}?hardDelete=${hardDelete}`);
  }
}
