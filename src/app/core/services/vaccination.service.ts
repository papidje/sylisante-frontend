import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateVaccinationRequest,
  VaccinationOverviewDto,
  VaccinationRecordDto,
} from '../models/vaccination.model';

@Injectable({ providedIn: 'root' })
export class VaccinationService {
  constructor(private http: HttpClient) {}

  getMine(): Observable<VaccinationOverviewDto> {
    return this.http.get<VaccinationOverviewDto>('/api/patients/me/vaccinations');
  }

  addMine(request: CreateVaccinationRequest): Observable<VaccinationRecordDto> {
    return this.http.post<VaccinationRecordDto>('/api/patients/me/vaccinations', request);
  }

  deleteMine(id: number): Observable<void> {
    return this.http.delete<void>(`/api/patients/me/vaccinations/${id}`);
  }

  getForPatient(patientUserId: number): Observable<VaccinationOverviewDto> {
    return this.http.get<VaccinationOverviewDto>(`/api/patients/${patientUserId}/vaccinations`);
  }

  addForPatient(patientUserId: number, request: CreateVaccinationRequest): Observable<VaccinationRecordDto> {
    return this.http.post<VaccinationRecordDto>(`/api/patients/${patientUserId}/vaccinations`, request);
  }

  deleteForPatient(patientUserId: number, id: number): Observable<void> {
    return this.http.delete<void>(`/api/patients/${patientUserId}/vaccinations/${id}`);
  }
}
