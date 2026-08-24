import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ApiResponse,
  SalaryStructureComponentRequest,
  SalaryStructureComponentResponse
} from '../../shared/models/Salarystructurecomponent/salarystructurecomponent';

@Injectable({
  providedIn: 'root'
})
export class SalaryStructureComponentService {
  private apiUrl = 'https://localhost:7135/api/SalaryStructureComponents';

  constructor(private http: HttpClient) { }

  // -----------------------------------------------------------------
  // Same defensive mapper used in SalaryStructureService — ASP.NET
  // Core's camelCase JSON policy only lowercases the FIRST letter of
  // a property, so "SSC_Id" can come back as "sSC_Id" instead of the
  // exact casing the UI expects. This reads any casing safely.
  // -----------------------------------------------------------------
  private pick(raw: Record<string, any>, candidates: string[]): any {
    const lowerMap: Record<string, any> = {};
    Object.keys(raw ?? {}).forEach(k => {
      lowerMap[k.toLowerCase()] = raw[k];
    });

    for (const key of candidates) {
      const value = lowerMap[key.toLowerCase()];
      if (value !== undefined) return value;
    }
    return undefined;
  }

  private mapItem(raw: any): SalaryStructureComponentResponse {
    if (!raw) return raw;
    return {
      SSC_Id: this.pick(raw, ['SSC_Id', 'ssc_Id', 'Id', 'id']),
      SSC_SS_Id: this.pick(raw, ['SSC_SS_Id', 'ssc_SS_Id', 'SS_Id', 'ssId']),
      SSC_SC_Id: this.pick(raw, ['SSC_SC_Id', 'ssc_SC_Id', 'SC_Id', 'scId']),
      SSC_CalculationType: this.pick(raw, ['SSC_CalculationType', 'ssc_CalculationType', 'CalculationType', 'calculationType']),
      SSC_Value: this.pick(raw, ['SSC_Value', 'ssc_Value', 'Value', 'value']),
      SSC_DisplayOrder: this.pick(raw, ['SSC_DisplayOrder', 'ssc_DisplayOrder', 'DisplayOrder', 'displayOrder']) ?? null,
      SSC_CreatedAt: this.pick(raw, ['SSC_CreatedAt', 'ssc_CreatedAt', 'CreatedAt', 'createdAt']) ?? null,
      SSC_UpdatedAt: this.pick(raw, ['SSC_UpdatedAt', 'ssc_UpdatedAt', 'UpdatedAt', 'updatedAt']) ?? null
    };
  }

  private mapList(rawList: any[]): SalaryStructureComponentResponse[] {
    return (rawList ?? []).map(r => this.mapItem(r));
  }

  getAll(): Observable<ApiResponse<SalaryStructureComponentResponse[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(res => ({ ...res, data: this.mapList(res.data) }))
    );
  }

  getById(id: number): Observable<ApiResponse<SalaryStructureComponentResponse>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetById/${id}`).pipe(
      map(res => ({ ...res, data: this.mapItem(res.data) }))
    );
  }

  add(request: SalaryStructureComponentRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request);
  }

  update(id: number, request: SalaryStructureComponentRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}`);
  }
}
