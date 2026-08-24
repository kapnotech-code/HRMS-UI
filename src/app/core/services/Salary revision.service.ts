import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  SalaryRevisionRequest,
  SalaryRevisionResponse
} from '../../shared/models/Salary_revision/Salary revision.model';

@Injectable({ providedIn: 'root' })
export class SalaryRevisionService {
  private apiUrl = `${environment.apiUrl}/SalaryRevision`;

  constructor(private http: HttpClient) { }

  // -----------------------------------------------------------------
  // Defensive field mapper — ASP.NET Core's default camelCase JSON
  // policy only lowercases the FIRST letter of a property, so
  // "SR_EmployeeId" can come back as "sR_EmployeeId" instead of the
  // "sr_EmployeeId" the UI expects. This reads any casing safely,
  // so the table never shows blank/undefined cells because of it.
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

  private mapItem(raw: any): SalaryRevisionResponse {
    if (!raw) return raw;
    return {
      sr_Id: this.pick(raw, ['sr_Id', 'SR_Id', 'Id', 'id']),
      sr_EmployeeId: this.pick(raw, ['sr_EmployeeId', 'SR_EmployeeId', 'EmployeeId', 'employeeId']),
      sr_PreviousES_Id: this.pick(raw, ['sr_PreviousES_Id', 'SR_PreviousES_Id', 'PreviousES_Id', 'previousESId']) ?? null,
      sr_NewES_Id: this.pick(raw, ['sr_NewES_Id', 'SR_NewES_Id', 'NewES_Id', 'newESId']),
      sr_RevisionType: this.pick(raw, ['sr_RevisionType', 'SR_RevisionType', 'RevisionType', 'revisionType']),
      sr_RevisionDate: this.pick(raw, ['sr_RevisionDate', 'SR_RevisionDate', 'RevisionDate', 'revisionDate']),
      sr_Reason: this.pick(raw, ['sr_Reason', 'SR_Reason', 'Reason', 'reason']) ?? null,
      sr_ApprovedBy: this.pick(raw, ['sr_ApprovedBy', 'SR_ApprovedBy', 'ApprovedBy', 'approvedBy']) ?? null,
      sr_CreatedAt: this.pick(raw, ['sr_CreatedAt', 'SR_CreatedAt', 'CreatedAt', 'createdAt']) ?? null
    };
  }

  private mapList(rawList: any[]): SalaryRevisionResponse[] {
    return (rawList ?? []).map(r => this.mapItem(r));
  }

  // GET: api/SalaryRevision/GetAll
  getAll(): Observable<ApiResponse<SalaryRevisionResponse[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(res => ({ ...res, data: this.mapList(res.data) }))
    );
  }

  // GET: api/SalaryRevision/GetById/5
  getById(id: number): Observable<ApiResponse<SalaryRevisionResponse>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetById/${id}`).pipe(
      map(res => ({ ...res, data: this.mapItem(res.data) }))
    );
  }

  // POST: api/SalaryRevision/Add
  add(request: SalaryRevisionRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request);
  }

  // PUT: api/SalaryRevision/Update/5
  update(id: number, request: SalaryRevisionRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request);
  }

  // DELETE: api/SalaryRevision/Delete/5
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/Delete/${id}`);
  }
}
