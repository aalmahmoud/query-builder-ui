import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, PermissionRequest } from '../models/permission.model';
import { EntityMetadata, ExportRequest, Page, QueryRequest } from '../models/query.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private url = `${environment.apiUrl}/permission`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 100, sort = 'resource,asc'): Observable<Page<Permission>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Permission>>(this.url, { params });
  }

  getById(id: number): Observable<Permission> {
    return this.http.get<Permission>(`${this.url}/${id}`);
  }

  create(p: PermissionRequest): Observable<void> {
    return this.http.post<void>(this.url, p);
  }

  update(id: number, p: PermissionRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, p);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  metadata(): Observable<EntityMetadata> {
    return this.http.get<EntityMetadata>(`${this.url}/metadata`);
  }

  query(request: QueryRequest, page = 0, size = 10, sort = 'resource,asc'): Observable<Page<Permission>> {
    const params = new HttpParams()
      .set('page', page).set('size', size).set('sort', sort);
    return this.http.post<Page<Permission>>(`${this.url}/query`, request, { params });
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
