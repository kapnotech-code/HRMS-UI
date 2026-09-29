import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentCategory, DocumentCategoryFilter } from '../../shared/models/documentcategory/document';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentCategoryService {

  private apiUrl = `${environment.apiUrl}/DocumentCategory`;

  constructor(private http: HttpClient) { }


  getAll(filter?: DocumentCategoryFilter): Observable<any> {

    let url = `${this.apiUrl}/GetAll`;

    if (filter?.onlyActive != null) {
      url += `?OnlyActive=${filter.onlyActive}`;
    }

    return this.http.get(url);
  }


  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetById/${id}`);
  }


  add(data: DocumentCategory): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Add`,
      data
    );
  }


  update(id: number, data: DocumentCategory): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/Update/${id}`,
      data
    );
  }


  delete(id: number, hardDelete = false): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/Delete/${id}?hardDelete=${hardDelete}`
    );

  }

}
