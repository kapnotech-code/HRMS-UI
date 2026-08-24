import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  EmployeeSalaryComponent,
  EmployeeSalaryComponentRequest
} from '../../shared/models/employee-salary-component/employee-salary-components.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeSalaryComponentsService {
  private readonly apiUrl =
    'https://localhost:7135/api/EmployeeSalaryComponents';

  constructor(private http: HttpClient) { }

  // -----------------------------------------------------------------
  // ASP.NET Core's camelCase JSON policy only lowercases the FIRST
  // letter of a property, so a backend column like "ESC_Id" comes
  // back as "eSC_Id" instead of "esc_Id"/"ESC_Id" that the UI checks
  // for. That mismatch was causing every column (ID, Employee Salary
  // ID, Salary Component ID, Calculation Type, Value, Amount,
  // Created At) to render as blank/0. This picks the value using a
  // fully case-insensitive lookup so any casing coming back from the
  // API is handled correctly.
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

  private mapItem(raw: any): EmployeeSalaryComponent {
    if (!raw) return raw;
    return {
      esc_Id: this.pick(raw, ['esc_Id', 'ESC_Id', 'Id', 'id']),
      esc_ES_Id: this.pick(raw, ['esc_ES_Id', 'ESC_ES_Id', 'ES_Id', 'esId']),
      esc_SC_Id: this.pick(raw, ['esc_SC_Id', 'ESC_SC_Id', 'SC_Id', 'scId']),
      esc_CalculationType: this.pick(raw, [
        'esc_CalculationType',
        'ESC_CalculationType',
        'CalculationType',
        'calculationType'
      ]),
      esc_Value: this.pick(raw, ['esc_Value', 'ESC_Value', 'Value', 'value']),
      esc_Amount: this.pick(raw, ['esc_Amount', 'ESC_Amount', 'Amount', 'amount']),
      esc_CreatedAt: this.pick(raw, ['esc_CreatedAt', 'ESC_CreatedAt', 'CreatedAt', 'createdAt']) ?? null,
      esc_UpdatedAt: this.pick(raw, ['esc_UpdatedAt', 'ESC_UpdatedAt', 'UpdatedAt', 'updatedAt']) ?? null
    };
  }

  private mapList(rawList: any[]): EmployeeSalaryComponent[] {
    return (rawList ?? []).map(r => this.mapItem(r));
  }

  getAll(): Observable<EmployeeSalaryComponent[]> {
    return this.http
      .get<any>(`${this.apiUrl}/GetAll`)
      .pipe(
        map(response => this.mapList(response?.data ?? response ?? []))
      );
  }

  getById(id: number): Observable<EmployeeSalaryComponent> {
    return this.http
      .get<any>(`${this.apiUrl}/GetById/${id}`)
      .pipe(
        map(response => this.mapItem(response?.data ?? response))
      );
  }

  add(
    request: EmployeeSalaryComponentRequest
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Add`,
      request
    );
  }

  update(
    id: number,
    request: EmployeeSalaryComponentRequest
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/Update/${id}`,
      request
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/Delete/${id}`
    );
  }
}
