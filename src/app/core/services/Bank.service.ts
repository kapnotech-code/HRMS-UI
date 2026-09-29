import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankRequest } from '../../shared/models/Bank/Bankrequest';
import { BankResponse } from '../../shared/models/Bank/Bankresponse';
import { ApiResponse } from '../../shared/models/Bank/ApiResponse';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private readonly apiUrl = `${environment.apiUrl}/Bank`;

  constructor(private http: HttpClient) { }

  getAll(includeInactive: boolean = false): Observable<ApiResponse<BankResponse[]>> {
    return this.http.get<ApiResponse<BankResponse[]>>(`${this.apiUrl}?includeInactive=${includeInactive}`);
  }

  getById(id: number): Observable<ApiResponse<BankResponse>> {
    return this.http.get<ApiResponse<BankResponse>>(`${this.apiUrl}/${id}`);
  }

  add(bank: BankRequest): Observable<ApiResponse<BankResponse>> {
    return this.http.post<ApiResponse<BankResponse>>(this.apiUrl, bank);
  }

  update(id: number, bank: BankRequest): Observable<ApiResponse<BankResponse>> {
    return this.http.put<ApiResponse<BankResponse>>(`${this.apiUrl}/${id}`, bank);
  }

  delete(id: number, hardDelete: boolean = false): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.apiUrl}/${id}?hardDelete=${hardDelete}`
    );
  }

  restore(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/restore`, {});
  }
}
