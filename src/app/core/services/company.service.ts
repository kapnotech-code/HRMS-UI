import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyRequest } from '../../shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../shared/models/companylist/CompanyResponse';
import { ApiResponse } from '../../shared/models/companylist/ ApiResponse';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployerService {
  private readonly apiUrl = `${environment.apiUrl}/Employer`;

  constructor(private http: HttpClient) { }

  getAllForDropdown(): Observable<ApiResponse<CompanyResponse[]>> {
    return this.http.get<ApiResponse<CompanyResponse[]>>(this.apiUrl);
  }

  getAll(): Observable<ApiResponse<CompanyResponse[]>> {
    return this.http.get<ApiResponse<CompanyResponse[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<CompanyResponse>> {
    return this.http.get<ApiResponse<CompanyResponse>>(`${this.apiUrl}/${id}`);
  }

  add(company: CompanyRequest): Observable<ApiResponse<CompanyResponse>> {
    const formData = this.toFormData(company);
    return this.http.post<ApiResponse<CompanyResponse>>(this.apiUrl, formData);
  }

  update(id: number, company: CompanyRequest): Observable<ApiResponse<CompanyResponse>> {
    const formData = this.toFormData(company);
    return this.http.put<ApiResponse<CompanyResponse>>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number, hardDelete: boolean = false): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.apiUrl}/${id}?hardDelete=${hardDelete}`
    );
  }

  private toFormData(company: CompanyRequest): FormData {
    const formData = new FormData();

    if (company.companyID != null) {
      formData.append('companyID', company.companyID.toString());
    }
    formData.append('companyName', company.companyName);

    if (company.fromDate) formData.append('fromDate', company.fromDate);
    if (company.toDate) formData.append('toDate', company.toDate);
    if (company.location) formData.append('location', company.location);
    if (company.contactPersonName) formData.append('contactPersonName', company.contactPersonName);
    if (company.contactNumber) formData.append('contactNumber', company.contactNumber);

    if (company.companyLogo) {
      formData.append('companyLogo', company.companyLogo, company.companyLogo.name);
    }
    if (company.companyImage) {
      formData.append('companyImage', company.companyImage, company.companyImage.name);
    }

    return formData;
  }
}
