import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  PayrollDetailsResponse,
  PayrollDetailsRequest,
  ApiResponse
} from '../../shared/models/Payrolldetail/Payrolldetail.model';

@Injectable({
  providedIn: 'root'
})
export class PayrollDetailsService {
  private apiUrl = 'https://localhost:7135/api/PayrollDetails';

  constructor(private http: HttpClient) { }

  // Picks the first matching key regardless of casing (PD_Id, pd_Id,
  // pD_Id, Id, id, ...) so a backend serialization change doesn't
  // silently blank out fields the way it did on the Payroll page.
  private pick(raw: Record<string, any>, candidates: string[]): any {
    if (!raw) return undefined;
    const lowerMap: Record<string, any> = {};
    Object.keys(raw).forEach(key => {
      lowerMap[key.toLowerCase()] = raw[key];
    });
    for (const key of candidates) {
      const value = lowerMap[key.toLowerCase()];
      if (value !== undefined) return value;
    }
    return undefined;
  }

  private mapDetail(raw: any): PayrollDetailsResponse {
    if (!raw) return raw;
    return {
      pd_Id: Number(this.pick(raw, ['pd_Id', 'PD_Id', 'Id', 'id']) ?? 0),
      pd_PR_Id: Number(this.pick(raw, ['pd_PR_Id', 'PD_PR_Id', 'PR_Id', 'pr_Id']) ?? 0),
      pd_SC_Id: Number(this.pick(raw, ['pd_SC_Id', 'PD_SC_Id', 'SC_Id', 'sc_Id']) ?? 0),
      pd_ComponentName: String(this.pick(raw, ['pd_ComponentName', 'PD_ComponentName', 'ComponentName']) ?? ''),
      pd_ComponentType: String(this.pick(raw, ['pd_ComponentType', 'PD_ComponentType', 'ComponentType']) ?? ''),
      pd_CalculationType: String(this.pick(raw, ['pd_CalculationType', 'PD_CalculationType', 'CalculationType']) ?? ''),
      pd_RateOrValue: this.pick(raw, ['pd_RateOrValue', 'PD_RateOrValue', 'RateOrValue']) ?? null,
      pd_Amount: Number(this.pick(raw, ['pd_Amount', 'PD_Amount', 'Amount']) ?? 0),
      pd_CreatedAt: this.pick(raw, ['pd_CreatedAt', 'PD_CreatedAt', 'CreatedAt'])
    };
  }

  private mapList(rawList: any[]): PayrollDetailsResponse[] {
    return (rawList ?? []).map(item => this.mapDetail(item));
  }

  getAll(): Observable<ApiResponse<PayrollDetailsResponse[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(response => {
        const list = Array.isArray(response as any)
          ? (response as any)
          : ((response as any)?.data ?? []);
        return { success: true, message: '', data: this.mapList(list) };
      })
    );
  }

  getById(id: number): Observable<ApiResponse<PayrollDetailsResponse>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetById/${id}`).pipe(
      map(response => ({ ...response, data: this.mapDetail(response?.data) }))
    );
  }

  add(request: PayrollDetailsRequest): Observable<ApiResponse<{ PD_Id: number }>> {
    return this.http.post<ApiResponse<{ PD_Id: number }>>(`${this.apiUrl}/Add`, request);
  }

  update(id: number, request: PayrollDetailsRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}`);
  }
}
