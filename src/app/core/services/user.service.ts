import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRequest } from '../models/user.model';
import { EntityMetadata, ExportRequest, Page, QueryRequest } from '../models/query.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10, sort = 'createdDate,desc'): Observable<Page<User>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<User>>(this.url, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.url}/${id}`);
  }

  create(user: UserRequest): Observable<void> {
    return this.http.post<void>(this.url, user);
  }

  update(id: number, user: UserRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, user);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  changeStatus(id: number, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/change-status`, { isActive });
  }

  metadata(): Observable<EntityMetadata> {
    return this.http.get<EntityMetadata>(`${this.url}/metadata`);
  }

  query(request: QueryRequest, page = 0, size = 10, sort = 'createdDate,desc'): Observable<Page<User>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.post<Page<User>>(`${this.url}/query`, request, { params });
  }

  count(request: QueryRequest): Observable<number> {
    return this.http.post<number>(`${this.url}/count`, request);
  }

  exists(request: QueryRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.url}/exists`, request);
  }

  export(request: ExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export/query`, request, {
      responseType: 'blob',
    });
  }
}
