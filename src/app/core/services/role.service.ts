import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, RoleRequest } from '../models/role.model';
import { EntityMetadata, ExportRequest, Page, QueryRequest } from '../models/query.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private url = `${environment.apiUrl}/role`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 100, sort = 'name,asc'): Observable<Page<Role>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Role>>(this.url, { params });
  }

  getById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.url}/${id}`);
  }

  create(role: RoleRequest): Observable<void> {
    return this.http.post<void>(this.url, role);
  }

  update(id: number, role: RoleRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, role);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  metadata(): Observable<EntityMetadata> {
    return this.http.get<EntityMetadata>(`${this.url}/metadata`);
  }

  query(request: QueryRequest, page = 0, size = 10, sort = 'name,asc'): Observable<Page<Role>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.post<Page<Role>>(`${this.url}/query`, request, { params });
  }

  count(request: QueryRequest): Observable<number> {
    return this.http.post<number>(`${this.url}/count`, request);
  }

  export(request: ExportRequest): Observable<Blob> {
    return this.http.post(`${this.url}/export/query`, request, {
      responseType: 'blob',
    });
  }
}
