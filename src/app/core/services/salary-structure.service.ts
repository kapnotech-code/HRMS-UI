import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import {
  SalaryStructureResponse,
  SalaryStructureRequest
} from '../../shared/models/salary-structure/salary-structure';

@Injectable({ providedIn: 'root' })
export class SalaryStructureService {
  private apiUrl = `${environment.apiUrl}/SalaryStructure`;

  constructor(private http: HttpClient) { }

  // -----------------------------------------------------------------
  // Defensive field mapper.
  // ASP.NET Core's default camelCase JSON policy only lowercases the
  // FIRST letter of a property, so "SS_Id" can come back over the
  // wire as "sS_Id" instead of the "ss_Id" the UI expects. This reads
  // a field by trying every likely casing, so the table never shows
  // blank cells because of this again.
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

  private mapStructure(raw: any): SalaryStructureResponse {
    if (!raw) return raw;
    return {
      ss_Id: this.pick(raw, ['ss_Id', 'SS_Id', 'Id', 'id']),
      ss_StructureName: this.pick(raw, ['ss_StructureName', 'SS_StructureName', 'StructureName', 'structureName']),
      ss_PayFrequency: this.pick(raw, ['ss_PayFrequency', 'SS_PayFrequency', 'PayFrequency', 'payFrequency']),
      ss_Description: this.pick(raw, ['ss_Description', 'SS_Description', 'Description', 'description']),
      ss_IsActive: this.pick(raw, ['ss_IsActive', 'SS_IsActive', 'IsActive', 'isActive']),
      ss_CreatedAt: this.pick(raw, ['ss_CreatedAt', 'SS_CreatedAt', 'CreatedAt', 'createdAt']),
      ss_UpdatedAt: this.pick(raw, ['ss_UpdatedAt', 'SS_UpdatedAt', 'UpdatedAt', 'updatedAt'])
    };
  }

  private mapStructureList(rawList: any[]): SalaryStructureResponse[] {
    return (rawList ?? []).map(r => this.mapStructure(r));
  }

  // GET: api/SalaryStructure/GetAll
  getAll(): Observable<SalaryStructureResponse[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(res => this.mapStructureList(res.data ?? []))
    );
  }

  // GET: api/SalaryStructure/GetById/5
  getById(id: number): Observable<SalaryStructureResponse> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetById/${id}`).pipe(
      map(res => this.mapStructure(res.data))
    );
  }

  // POST: api/SalaryStructure/Add
  add(request: SalaryStructureRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request);
  }

  // PUT: api/SalaryStructure/Update/5
  update(id: number, request: SalaryStructureRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request);
  }

  // DELETE: api/SalaryStructure/Delete/5
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}`);
  }
}
