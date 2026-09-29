import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { ApiResponse } from '../../shared/models/api-response';

import {
  YearlyPaidRequest,
  YearlyPaidApproveRequest,
  YearlyPaidMarkPaidRequest
} from '../../shared/models/yearly-paid/yearly-paid-request.model';

import { YearlyPaidResponse } from '../../shared/models/yearly-paid/yearly-paid-response.model';

@Injectable({
  providedIn: 'root'
})
export class YearlyPaidService {

  private apiUrl = `${environment.apiUrl}/YearlyPaid`;

  constructor(private http: HttpClient) { }

  // =========================================================
  // HELPER: pick the first defined value among possible key
  // names on an object. Handles inconsistent API casing —
  // e.g. the backend serializes "YP_Id" as "yP_Id" (only the
  // very first letter gets lowercased by System.Text.Json's
  // default camelCase policy), which never matched the
  // frontend's PascalCase "YP_Id" property access before.
  // =========================================================

  private pick(item: any, ...keys: string[]): any {
    if (!item) return undefined;
    const allKeys: string[] = [];
    for (const key of keys) {
      allKeys.push(key);
      allKeys.push(key.charAt(0).toLowerCase() + key.slice(1));   // yP_Id
      allKeys.push(key.charAt(0).toUpperCase() + key.slice(1));   // YP_Id
      allKeys.push(key.toLowerCase());
      allKeys.push(key.toUpperCase());
    }
    for (const key of allKeys) {
      if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
        return item[key];
      }
    }
    return undefined;
  }

  private normalizeYearlyPaid(item: any): YearlyPaidResponse {
    return {
      YP_Id: this.pick(item, 'YP_Id', 'id'),
      YP_ST_Id: this.pick(item, 'YP_ST_Id'),
      YP_EmployeeId: this.pick(item, 'YP_EmployeeId'),
      EmployeeName: this.pick(item, 'EmployeeName', 'employeeName'),
      YP_Year: this.pick(item, 'YP_Year'),
      YP_EligibleDays: this.pick(item, 'YP_EligibleDays'),
      YP_PaidDays: this.pick(item, 'YP_PaidDays'),
      YP_Amount: this.pick(item, 'YP_Amount'),
      YP_Status: this.pick(item, 'YP_Status'),
      YP_PayrollId: this.pick(item, 'YP_PayrollId'),
      YP_PaidDate: this.pick(item, 'YP_PaidDate'),
      YP_Remarks: this.pick(item, 'YP_Remarks')
    } as YearlyPaidResponse;
  }

  // ==========================================
  // GET ALL
  // ==========================================
  getAll(): Observable<ApiResponse<YearlyPaidResponse[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/GetAll`
    ).pipe(
      map(response => ({
        ...response,
        data: Array.isArray(response?.data)
          ? response.data.map(item => this.normalizeYearlyPaid(item))
          : []
      }))
    );
  }

  // ==========================================
  // GET BY EMPLOYEE
  // ==========================================
  getByEmployeeId(
    employeeId: number
  ): Observable<ApiResponse<YearlyPaidResponse[]>> {

    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/GetByEmployee/${employeeId}`
    ).pipe(
      map(response => ({
        ...response,
        data: Array.isArray(response?.data)
          ? response.data.map(item => this.normalizeYearlyPaid(item))
          : []
      }))
    );
  }

  // ==========================================
  // ADD
  // ==========================================
  add(
    request: YearlyPaidRequest
  ): Observable<ApiResponse<any>> {

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/Add`,
      request
    );
  }

  // ==========================================
  // UPDATE
  // ==========================================
  update(
    id: number,
    request: YearlyPaidRequest
  ): Observable<ApiResponse<any>> {

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/Update/${id}`,
      request
    );
  }

  // ==========================================
  // DELETE
  // ==========================================
  delete(
    id: number
  ): Observable<ApiResponse<any>> {

    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/Delete/${id}`
    );
  }

  // ==========================================
  // APPROVE
  // ==========================================
  approve(
    id: number,
    request: YearlyPaidApproveRequest
  ): Observable<ApiResponse<any>> {

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/Approve/${id}`,
      request
    );
  }

  // ==========================================
  // MARK PAID
  // ==========================================
  markPaid(
    id: number,
    request: YearlyPaidMarkPaidRequest
  ): Observable<ApiResponse<any>> {

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/MarkPaid/${id}`,
      request
    );
  }
}
