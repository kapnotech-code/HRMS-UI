import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Page } from '../../shared/models/Pag/Page';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn:'root'
})
export class PageService {

  private apiUrl = `${environment.apiUrl}/Page`;

  constructor(
    private http:HttpClient
  ){}

  getAll():Observable<Page[]>{
    return this.http
      .get<any>(this.apiUrl)
      .pipe(
        map((res: any) => (res?.data ?? res ?? []) as Page[])
      );
  }

  create(data:Page):Observable<any>{
    return this.http.post(
      this.apiUrl,
      data
    );
  }

  update(id:number,data:Page):Observable<any>{
    return this.http.put(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  delete(id:number):Observable<any>{
    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }
}