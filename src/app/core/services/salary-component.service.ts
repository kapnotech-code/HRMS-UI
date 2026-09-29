import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  SalaryComponentRequest,
  SalaryComponentResponse
} from '../../shared/models/salary-component/salary-component.model';
import { mapSalaryComponent, mapSalaryComponentList } from '../../shared/models/salary-component/salary-component.mapper';

@Injectable({
  providedIn: 'root'
})
export class SalaryComponentService {
  private apiUrl = `${environment.apiUrl}/SalaryComponent`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<SalaryComponentResponse[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(res => mapSalaryComponentList(res.data ?? []))
    );
  }

  getById(id: number): Observable<SalaryComponentResponse> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/GetById/${id}`).pipe(
      map(res => mapSalaryComponent(res.data))
    );
  }

  add(request: SalaryComponentRequest): Observable<ApiResponse<SalaryComponentResponse>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request).pipe(
      map(res => ({ ...res, data: mapSalaryComponent(res.data) }))
    );
  }

  update(id: number, request: SalaryComponentRequest): Observable<ApiResponse<SalaryComponentResponse>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Update/${id}`, request).pipe(
      map(res => ({ ...res, data: mapSalaryComponent(res.data) }))
    );
  }

  delete(id: number, hardDelete: boolean = true): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/Delete/${id}`);
  }
}
