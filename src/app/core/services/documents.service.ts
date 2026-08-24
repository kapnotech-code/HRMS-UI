import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { DocumentsResponse } from '../../shared/models/documents/documents-response.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private baseUrl = 'https://localhost:7135/api/Documents';

  constructor(private http: HttpClient) { }

  getAll(): Observable<DocumentsResponse[]> {
    return this.http.get<any>(`${this.baseUrl}/GetAll`).pipe(
      map((response: any) => {
        const list = Array.isArray(response)
          ? response
          : (response?.data ?? []);
        return list;
      })
    );
  }

  getById(id: number): Observable<DocumentsResponse> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map((response: any) => {
        return (response?.data ?? response) as DocumentsResponse;
      })
    );
  }

  add(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, formData);
  }

  update(formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}`, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}