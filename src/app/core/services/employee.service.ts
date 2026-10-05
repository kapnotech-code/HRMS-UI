import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { environment } from '../../../environments/environment';
import { EmployeeResponse } from '../../shared/models/employee/employee-response';
import { EmployeeRequest } from '../../shared/models/employee/employee-request';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/Employee`;
  constructor(private http: HttpClient) {}

  // GET: api/Employee/GetAll
  getAll(): Observable<EmployeeResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeResponse[]>>(`${this.apiUrl}/GetAll`)
      .pipe(map((res) => res.data ?? []));
  }

  // GET: api/Employee/GetAllForDropdown
  getAllForDropdown(): Observable<EmployeeResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeResponse[]>>(`${this.apiUrl}/GetAllForDropdown`)
      .pipe(map((res) => res.data ?? []));
  }

  // GET: api/Employee/GetById/5
  getById(id: number): Observable<EmployeeResponse> {
    return this.http
      .get<ApiResponse<EmployeeResponse>>(`${this.apiUrl}/GetById/${id}`)
      .pipe(map((res) => res.data!));
  }

  // POST: api/Employee/Add
  // Controller binds [FromBody] EmployeeRequest request directly — send the object as-is.
  add(request: EmployeeRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Add`, request);
  }

  // PUT: api/Employee/{id}
  update(id: number, request: EmployeeRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, request);
  }

  // DELETE: api/Employee/Delete/5?hardDelete=false
  delete(id: number, hardDelete: boolean = false): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/Delete/${id}?hardDelete=${hardDelete}`,
    );
  }
  uploadFile(file: File, type: 'profile' | 'resume' | 'document'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const category = type === 'document' ? 'resume' : type;
    return this.http.post<any>(
      `${this.apiUrl}/UploadFile?category=${encodeURIComponent(category)}`,
      formData
    );
  }
}
