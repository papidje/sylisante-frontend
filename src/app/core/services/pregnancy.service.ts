import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClosePregnancyRequest,
  CreatePregnancyVisitRequest,
  PregnancyOverviewDto,
  PregnancyVisitDto,
  StartPregnancyRequest,
} from '../models/pregnancy.model';

@Injectable({ providedIn: 'root' })
export class PregnancyService {
  constructor(private http: HttpClient) {}

  getMine(): Observable<PregnancyOverviewDto> {
    return this.http.get<PregnancyOverviewDto>('/api/patients/me/pregnancy');
  }

  startMine(request: StartPregnancyRequest): Observable<PregnancyOverviewDto> {
    return this.http.post<PregnancyOverviewDto>('/api/patients/me/pregnancy', request);
  }

  closeMine(request: ClosePregnancyRequest): Observable<PregnancyOverviewDto> {
    return this.http.post<PregnancyOverviewDto>('/api/patients/me/pregnancy/close', request);
  }

  getForPatient(patientUserId: number): Observable<PregnancyOverviewDto> {
    return this.http.get<PregnancyOverviewDto>(`/api/patients/${patientUserId}/pregnancy`);
  }

  startForPatient(patientUserId: number, request: StartPregnancyRequest): Observable<PregnancyOverviewDto> {
    return this.http.post<PregnancyOverviewDto>(`/api/patients/${patientUserId}/pregnancy`, request);
  }

  closeForPatient(patientUserId: number, request: ClosePregnancyRequest): Observable<PregnancyOverviewDto> {
    return this.http.post<PregnancyOverviewDto>(`/api/patients/${patientUserId}/pregnancy/close`, request);
  }

  addVisit(patientUserId: number, request: CreatePregnancyVisitRequest): Observable<PregnancyVisitDto> {
    return this.http.post<PregnancyVisitDto>(`/api/patients/${patientUserId}/pregnancy/visits`, request);
  }
}
