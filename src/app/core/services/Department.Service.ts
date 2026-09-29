import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { DepartmentRequest } from '../../shared/models/DepartmentResponse/DepartmentRequest';
import { DepartmentResponse } from '../../shared/models/DepartmentResponse/DepartmentResponse';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/EmployeeDepartment`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<DepartmentResponse[]> {
    return this.http.get<ApiResponse<DepartmentResponse[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(res => res.data ?? [])
    );
  }

  getById(id: number): Observable<DepartmentResponse> {
    return this.http.get<ApiResponse<DepartmentResponse>>(`${this.apiUrl}/GetById/${id}`).pipe(
      map(res => res.data!)
    );
  }

  create(data: DepartmentRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, data);
  }

  update(id: number, data: DepartmentRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number, hardDelete: boolean = false): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Delete/${id}?hardDelete=${hardDelete}`);
  }
}
