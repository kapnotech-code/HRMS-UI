import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Menu, MenuTree } from '../../shared/models/Menu/menu.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = 'https://localhost:7135/api/Menu';

  constructor(private http: HttpClient) { }

  getAll(search?: string): Observable<Menu[]> {
    return this.http
      .get<ApiResponse<Menu[]>>(`${this.apiUrl}?search=${search || ''}`)
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<Menu> {
    return this.http
      .get<ApiResponse<Menu>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  // ⭐ CHANGED — Observable<any>, pura response return
  create(menu: Menu): Observable<any> {
    return this.http.post<ApiResponse<{ menuId: number }>>(this.apiUrl, menu);
  }

  // ⭐ CHANGED — Observable<any>, .pipe(map) hataya
  update(id: number, menu: Menu): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, menu);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getMenuTree(): Observable<MenuTree[]> {
    return this.http
      .get<ApiResponse<MenuTree[]>>(`${this.apiUrl}/tree`)
      .pipe(map(res => res.data));
  }
}
