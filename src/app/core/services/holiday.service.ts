import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { HolidayRequest } from '../../shared/models/Holidays/HolidayRequest';

import {  HolidayResponse } from '../../shared/models/Holidays/HolidayResponse';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private apiUrl = `${environment.apiUrl}/Holiday`;

  constructor(private http: HttpClient) { }

  // GET api/Holiday
  getAll(): Observable<HolidayResponse[]> {
    return this.http.get<ApiResponse<HolidayResponse[]>>(`${this.apiUrl}`).pipe(
      map(res => res.data ?? [])
    );
  }

  // GET api/Holiday/{id}
  getById(id: number): Observable<HolidayResponse> {
    return this.http.get<ApiResponse<HolidayResponse>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data!)
    );
  }

  // POST api/Holiday
  add(request: HolidayRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}`, request);
  }

  // PUT api/Holiday  (no {id} in the route — HolidayID must be set inside the body)
  update(request: HolidayRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}`, request);
  }

  // DELETE api/Holiday/{id}?hardDelete=false
  // Note: backend returns 204 No Content on success (no JSON body)
  delete(id: number, hardDelete: boolean = false): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}?hardDelete=${hardDelete}`);
  }
}
