import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BloodPressureReadingDto,
  CreateBloodPressureRequest,
  CreateGlucoseRequest,
  CreateHba1cRequest,
  GlucoseReadingDto,
  Hba1cReadingDto,
  VitalSummaryDto,
} from '../models/vital.model';

@Injectable({ providedIn: 'root' })
export class VitalService {
  constructor(private http: HttpClient) {}

  getMySummary(): Observable<VitalSummaryDto> {
    return this.http.get<VitalSummaryDto>('/api/patients/me/vitals/summary');
  }

  listMyBloodPressure(): Observable<BloodPressureReadingDto[]> {
    return this.http.get<BloodPressureReadingDto[]>('/api/patients/me/vitals/blood-pressure');
  }

  addMyBloodPressure(request: CreateBloodPressureRequest): Observable<BloodPressureReadingDto> {
    return this.http.post<BloodPressureReadingDto>('/api/patients/me/vitals/blood-pressure', request);
  }

  listMyGlucose(): Observable<GlucoseReadingDto[]> {
    return this.http.get<GlucoseReadingDto[]>('/api/patients/me/vitals/glucose');
  }

  addMyGlucose(request: CreateGlucoseRequest): Observable<GlucoseReadingDto> {
    return this.http.post<GlucoseReadingDto>('/api/patients/me/vitals/glucose', request);
  }

  getSummaryForPatient(patientUserId: number): Observable<VitalSummaryDto> {
    return this.http.get<VitalSummaryDto>(`/api/patients/${patientUserId}/vitals/summary`);
  }

  listBloodPressureForPatient(patientUserId: number): Observable<BloodPressureReadingDto[]> {
    return this.http.get<BloodPressureReadingDto[]>(`/api/patients/${patientUserId}/vitals/blood-pressure`);
  }

  addBloodPressureForPatient(
    patientUserId: number,
    request: CreateBloodPressureRequest
  ): Observable<BloodPressureReadingDto> {
    return this.http.post<BloodPressureReadingDto>(
      `/api/patients/${patientUserId}/vitals/blood-pressure`,
      request
    );
  }

  listGlucoseForPatient(patientUserId: number): Observable<GlucoseReadingDto[]> {
    return this.http.get<GlucoseReadingDto[]>(`/api/patients/${patientUserId}/vitals/glucose`);
  }

  addGlucoseForPatient(patientUserId: number, request: CreateGlucoseRequest): Observable<GlucoseReadingDto> {
    return this.http.post<GlucoseReadingDto>(`/api/patients/${patientUserId}/vitals/glucose`, request);
  }

  addHba1cForPatient(patientUserId: number, request: CreateHba1cRequest): Observable<Hba1cReadingDto> {
    return this.http.post<Hba1cReadingDto>(`/api/patients/${patientUserId}/vitals/hba1c`, request);
  }
}
