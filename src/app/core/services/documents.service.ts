import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentsResponse } from '../../shared/models/documents/documents-response.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private baseUrl = 'https://localhost:7135/api/Documents';

  constructor(private http: HttpClient) { }

  getAll(): Observable<DocumentsResponse[]> {
    return this.http.get<DocumentsResponse[]>(`${this.baseUrl}`);
  }

  getById(id: number): Observable<DocumentsResponse> {
    return this.http.get<DocumentsResponse>(`${this.baseUrl}/${id}`);
  }

  // FormData used here (not DocumentsRequest) because file upload
  // requires multipart/form-data, not a plain JSON body.
  add(formData: FormData): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}`, formData);
  }

  update(formData: FormData): Observable<number> {
    return this.http.put<number>(`${this.baseUrl}`, formData);
  }

  delete(id: number): Observable<number> {
    return this.http.delete<number>(`${this.baseUrl}/${id}`);
  }
}
