import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ScheduleMasterResponse as SharedScheduleMasterResponse } from '../../shared/models/schedule-master.model/schedule-master-response.model';
import { ApiResponse } from '../../shared/models/api-response';

export type ScheduleMasterResponse = SharedScheduleMasterResponse;

export interface ScheduleProcessRequest {
  employeeIdCsv: string;
  transactionType: string;
  transactionDate: string;
  emailSubjectPrefix: string;

  reviewerId?: number | null;
  revieweeId?: number | null;
  reviewType?: string | null;
}

export interface ScheduleProcessResponse {
  st_Id?: number;
  se_Id?: number;
  employeeId?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleMasterService {

  private readonly apiUrl =
    `${environment.apiUrl}/ScheduleMaster`;

  constructor(
    private readonly http: HttpClient
  ) { }

  // ==========================================
  // GET ALL
  // ==========================================
  getAll(): Observable<ApiResponse<ScheduleMasterResponse[]>> {
    return this.http.get<ApiResponse<ScheduleMasterResponse[]>>(
      `${this.apiUrl}/GetAll`
    );
  }

  // ==========================================
  // GET BY ID
  // ==========================================
  getById(
    id: number
  ): Observable<ApiResponse<ScheduleMasterResponse>> {

    return this.http.get<ApiResponse<ScheduleMasterResponse>>(
      `${this.apiUrl}/GetById/${id}`
    );
  }

  // ==========================================
  // ADD
  // POST: api/ScheduleMaster/Add
  // ==========================================
  add(
    schedule: ScheduleMasterResponse
  ): Observable<ApiResponse<any>> {

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/Add`,
      schedule
    );
  }

  // ==========================================
  // UPDATE
  // PUT: api/ScheduleMaster/Update/{id}
  // ==========================================
  update(
    schedule: ScheduleMasterResponse
  ): Observable<ApiResponse<any>> {

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/Update/${schedule.sM_Id}`,
      schedule
    );
  }

  // ==========================================
  // SAVE
  // Convenience wrapper: routes to Add when there's
  // no sM_Id yet, otherwise routes to Update/{id}.
  // Kept so existing callers of .save() don't break.
  // ==========================================
  save(
    schedule: ScheduleMasterResponse
  ): Observable<ApiResponse<any>> {

    return schedule.sM_Id
      ? this.update(schedule)
      : this.add(schedule);
  }

  // ==========================================
  // DELETE
  // ==========================================
  delete(
    id: number,
    updatedBy: number,
    hardDelete: boolean = false
  ): Observable<ApiResponse<any>> {

    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/Delete/${id}`,
      {
        params: {
          updatedBy: updatedBy.toString(),
          hardDelete: hardDelete.toString()
        }
      }
    );
  }

  // ==========================================
  // PROCESS SCHEDULE
  // ==========================================
  processSchedule(
    scheduleId: number,
    request: ScheduleProcessRequest
  ): Observable<ApiResponse<ScheduleProcessResponse[]>> {

    return this.http.post<ApiResponse<ScheduleProcessResponse[]>>(
      `${this.apiUrl}/Process/${scheduleId}`,
      request
    );
  }
}
