// core/services/shift.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { ShiftResponse } from '../../shared/models/ShiftResponse/ShiftResponse';
import { ShiftRequest } from '../../shared/models/ShiftResponse/Shiftrequest';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ShiftService {
  // Backend route: [Route("api/[controller]")] -> api/Shift
  // Controller me GetAll ke liye extra "/GetAll" nahi hai, base [HttpGet] hi hai
  private apiUrl = `${environment.apiUrl}/Shift`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ShiftResponse[]> {
    return this.http.get<ApiResponse<ShiftResponse[]>>(`${this.apiUrl}`).pipe(
      map(res => res.data ?? [])
    );
  }

  getById(id: number): Observable<ShiftResponse> {
    return this.http.get<ApiResponse<ShiftResponse>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data!)
    );
  }

  create(payload: ShiftRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}`, payload);
  }

  update(id: number, payload: ShiftRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number, hardDelete: boolean = false): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}?hardDelete=${hardDelete}`);
  }
}
