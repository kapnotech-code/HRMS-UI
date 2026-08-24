import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ApiResponse,
  SalaryComponentRequest,
  SalaryComponentResponse
} from '../../shared/models/salary-component/salary-component.model';
import { mapSalaryComponent, mapSalaryComponentList } from '../../ features/Recruiter/salary-component-list.component/Salary component.mapper';

@Injectable({
  providedIn: 'root'
})
export class SalaryComponentService {
  private apiUrl = 'https://localhost:7135/api/SalaryComponent';

  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResponse<SalaryComponentResponse[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(res => ({
        ...res,
        data: mapSalaryComponentList(res.data)
      }))
    );
  }

  getById(id: number): Observable<ApiResponse<SalaryComponentResponse>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetById/${id}`).pipe(
      map(res => ({
        ...res,
        data: mapSalaryComponent(res.data)
      }))
    );
  }

  add(request: SalaryComponentRequest): Observable<ApiResponse<SalaryComponentResponse>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request).pipe(
      map(res => ({
        ...res,
        data: mapSalaryComponent(res.data)
      }))
    );
  }

  update(id: number, request: SalaryComponentRequest): Observable<ApiResponse<SalaryComponentResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request).pipe(
      map(res => ({
        ...res,
        data: mapSalaryComponent(res.data)
      }))
    );
  }

  delete(id: number, hardDelete: boolean = true): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/Delete/${id}`);
  }
}
