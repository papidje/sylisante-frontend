import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLogResponse, AuditLogPage } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly base = '/api/admin/audit-logs';

  constructor(private http: HttpClient) {}

  getLogs(email?: string, action?: string, page = 0, size = 50): Observable<AuditLogPage> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (email) params = params.set('email', email);
    if (action) params = params.set('action', action);
    return this.http.get<AuditLogPage>(this.base, { params });
  }
}
