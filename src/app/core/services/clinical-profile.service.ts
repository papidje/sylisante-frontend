import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AllergyDto,
  ClinicalProfileDto,
  CreateAllergyRequest,
  UpdateClinicalProfileRequest,
} from '../models/clinical-profile.model';

@Injectable({ providedIn: 'root' })
export class ClinicalProfileService {
  constructor(private http: HttpClient) {}

  getMine(): Observable<ClinicalProfileDto> {
    return this.http.get<ClinicalProfileDto>('/api/patients/me/clinical-profile');
  }

  updateMine(request: UpdateClinicalProfileRequest): Observable<ClinicalProfileDto> {
    return this.http.put<ClinicalProfileDto>('/api/patients/me/clinical-profile', request);
  }

  addAllergyMine(request: CreateAllergyRequest): Observable<AllergyDto> {
    return this.http.post<AllergyDto>('/api/patients/me/allergies', request);
  }

  deleteAllergyMine(allergyId: number): Observable<void> {
    return this.http.delete<void>(`/api/patients/me/allergies/${allergyId}`);
  }

  getForPatient(patientUserId: number): Observable<ClinicalProfileDto> {
    return this.http.get<ClinicalProfileDto>(`/api/patients/${patientUserId}/clinical-profile`);
  }

  updateForPatient(patientUserId: number, request: UpdateClinicalProfileRequest): Observable<ClinicalProfileDto> {
    return this.http.put<ClinicalProfileDto>(
      `/api/patients/${patientUserId}/clinical-profile`,
      request
    );
  }

  addAllergyForPatient(patientUserId: number, request: CreateAllergyRequest): Observable<AllergyDto> {
    return this.http.post<AllergyDto>(`/api/patients/${patientUserId}/allergies`, request);
  }

  deleteAllergyForPatient(patientUserId: number, allergyId: number): Observable<void> {
    return this.http.delete<void>(`/api/patients/${patientUserId}/allergies/${allergyId}`);
  }
}
