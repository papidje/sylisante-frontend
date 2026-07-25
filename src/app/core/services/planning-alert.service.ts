import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlanningAlertDto } from '../models/planning-alert.model';

@Injectable({ providedIn: 'root' })
export class PlanningAlertService {
  constructor(private http: HttpClient) {}

  getMyAlerts(): Observable<PlanningAlertDto[]> {
    return this.http.get<PlanningAlertDto[]>('/api/planning-alerts');
  }

  getUnresolvedCount(): Observable<{ unresolvedCount: number }> {
    return this.http.get<{ unresolvedCount: number }>('/api/planning-alerts/count');
  }

  resolveAlert(alertId: number): Observable<PlanningAlertDto> {
    return this.http.patch<PlanningAlertDto>(`/api/planning-alerts/${alertId}/resolve`, {});
  }
}
