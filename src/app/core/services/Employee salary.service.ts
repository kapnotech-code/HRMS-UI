import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  EmployeeSalaryRequestModel,
  EmployeeSalaryResponseModel,
} from '../../shared/models/Employee salary/Employee salary.model';

@Injectable({ providedIn: 'root' })
export class EmployeeSalaryService {
  private readonly baseUrl = `${environment.apiUrl}/EmployeeSalary`;

  constructor(private http: HttpClient) { }

  // -----------------------------------------------------------------
  // Defensive field mapper — same fix applied to SalaryStructureService.
  // ASP.NET Core's default camelCase JSON policy only lowercases the
  // FIRST letter of a property, so "ES_EmployeeId" can come back over
  // the wire as "eS_EmployeeId" instead of the "es_EmployeeId" the UI
  // expects. This reads each field by trying every likely casing, so
  // the table never shows "#undefined" / "SS-undefined" again.
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

  private mapSalary(raw: any): EmployeeSalaryResponseModel {
    if (!raw) return raw;
    return {
      es_Id: this.pick(raw, ['es_Id', 'ES_Id', 'Id', 'id']),
      es_EmployeeId: this.pick(raw, ['es_EmployeeId', 'ES_EmployeeId', 'EmployeeId', 'employeeId']),
      es_SS_Id: this.pick(raw, ['es_SS_Id', 'ES_SS_Id', 'SS_Id', 'ssId']),
      es_CompanyId: this.pick(raw, ['es_CompanyId', 'ES_CompanyId', 'CompanyId', 'companyId']),
      es_EffectiveFrom: this.pick(raw, ['es_EffectiveFrom', 'ES_EffectiveFrom', 'EffectiveFrom', 'effectiveFrom']),
      es_EffectiveTo: this.pick(raw, ['es_EffectiveTo', 'ES_EffectiveTo', 'EffectiveTo', 'effectiveTo']),
      es_BasicSalary: this.pick(raw, ['es_BasicSalary', 'ES_BasicSalary', 'BasicSalary', 'basicSalary']),
      es_AnnualCTC: this.pick(raw, ['es_AnnualCTC', 'ES_AnnualCTC', 'AnnualCTC', 'annualCTC', 'annualCtc']),
      es_MonthlyGross: this.pick(raw, ['es_MonthlyGross', 'ES_MonthlyGross', 'MonthlyGross', 'monthlyGross']),
      es_IsActive: this.pick(raw, ['es_IsActive', 'ES_IsActive', 'IsActive', 'isActive']),
      es_CreatedAt: this.pick(raw, ['es_CreatedAt', 'ES_CreatedAt', 'CreatedAt', 'createdAt']),
      es_UpdatedAt: this.pick(raw, ['es_UpdatedAt', 'ES_UpdatedAt', 'UpdatedAt', 'updatedAt'])
    } as EmployeeSalaryResponseModel;
  }

  private mapSalaryList(rawList: any[]): EmployeeSalaryResponseModel[] {
    return (rawList ?? []).map(r => this.mapSalary(r));
  }

  getAll(): Observable<EmployeeSalaryResponseModel[]> {
    return this.http
      .get<any>(`${this.baseUrl}/GetAll`)
      .pipe(
        map(response => this.mapSalaryList(response?.data ?? response ?? []))
      );
  }

  getById(id: number): Observable<EmployeeSalaryResponseModel> {
    return this.http
      .get<any>(`${this.baseUrl}/GetById/${id}`)
      .pipe(
        map(response => this.mapSalary(response?.data ?? response))
      );
  }

  add(model: EmployeeSalaryRequestModel): Observable<ApiResponse<{ es_Id: number }>> {
    return this.http.post<ApiResponse<{ es_Id: number }>>(`${this.baseUrl}/Add`, model);
  }

  update(id: number, model: EmployeeSalaryRequestModel): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.baseUrl}/Update/${id}`, model);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/Delete/${id}`);
  }
}
