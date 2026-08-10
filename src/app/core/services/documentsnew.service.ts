import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentTypesRequest, DocumentTypesResponse } from '../../shared/models/Documentsnew/documentsnew-typerequest.model';
import { ApiResponse } from '../../ features/Master/Documentsnew/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class DocumentTypesService {
  private apiUrl = 'https://localhost:7135/api/DocumentTypes';

  constructor(private http: HttpClient) { }

  // Backend har response ko { success, message, data, statusCode } mein wrap karta hai,
  // isliye ApiResponse<T> use karo — .data se hi actual value nikalti hai.
  getAll(includeInactive = false): Observable<ApiResponse<DocumentTypesResponse[]>> {
    return this.http.get<ApiResponse<DocumentTypesResponse[]>>(
      `${this.apiUrl}/GetAll?includeInactive=${includeInactive}`
    );
  }

  getById(id: number): Observable<ApiResponse<DocumentTypesResponse>> {
    return this.http.get<ApiResponse<DocumentTypesResponse>>(`${this.apiUrl}/GetById/${id}`);
  }

  add(data: DocumentTypesRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/Add`, data);
  }

  update(data: DocumentTypesRequest): Observable<ApiResponse<number>> {
    return this.http.put<ApiResponse<number>>(`${this.apiUrl}/Update`, data);
  }

  delete(id: number, hardDelete = false): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(`${this.apiUrl}/Delete/${id}?hardDelete=${hardDelete}`);
  }

  restore(id: number): Observable<ApiResponse<number>> {
    return this.http.patch<ApiResponse<number>>(`${this.apiUrl}/Restore/${id}`, {});
  }
}
