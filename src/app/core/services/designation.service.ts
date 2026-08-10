import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { DesignationRequest, DesignationResponse } from '../../shared/models/designation-response/designation-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DesignationService {
  // Controller route: [Route("api/[controller]")] -> api/Designation
  private apiUrl = `${environment.apiUrl}/Designation`;

  constructor(private http: HttpClient) { }

  // GET api/Designation
  getAll(): Observable<ApiResponse<DesignationResponse[]>> {
    return this.http.get<ApiResponse<DesignationResponse[]>>(this.apiUrl);
  }

  // GET api/Designation/{id}
  getById(id: number): Observable<ApiResponse<DesignationResponse>> {
    return this.http.get<ApiResponse<DesignationResponse>>(`${this.apiUrl}/${id}`);
  }

  // POST api/Designation
  create(data: Partial<DesignationRequest>): Observable<ApiResponse<DesignationRequest>> {
    return this.http.post<ApiResponse<DesignationRequest>>(this.apiUrl, data);
  }

  // PUT api/Designation/{id}  -> backend NoContent (204) return karta hai, body khali aayega
  update(id: number, data: Partial<DesignationRequest>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // DELETE api/Designation/{id} -> backend NoContent (204) return karta hai
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
