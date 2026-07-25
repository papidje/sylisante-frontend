import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PractitionerProfileDto,
  PractitionerSearchResult,
  UpdatePractitionerProfileRequest,
  DayScheduleResponse,
} from '../models/practitioner.model';

@Injectable({ providedIn: 'root' })
export class PractitionerService {
  constructor(private http: HttpClient) {}

  getAllPractitioners(): Observable<PractitionerProfileDto[]> {
    return this.http.get<PractitionerProfileDto[]>('/api/practitioners/public');
  }

  search(cityId: number | null, specialtyId: number | null): Observable<PractitionerSearchResult[]> {
    let params = new HttpParams();
    if (cityId) params = params.set('cityId', cityId);
    if (specialtyId) params = params.set('specialtyId', specialtyId);
    return this.http.get<PractitionerSearchResult[]>('/api/practitioners/public/search', { params });
  }

  getById(userId: number): Observable<PractitionerProfileDto> {
    return this.http.get<PractitionerProfileDto>(`/api/practitioners/public/${userId}`);
  }

  getSlots(practitionerId: number, date: string | null, specialtyId: number): Observable<DayScheduleResponse> {
    let params = new HttpParams().set('specialtyId', specialtyId);
    if (date) params = params.set('date', date);
    return this.http.get<DayScheduleResponse>(`/api/practitioners/public/${practitionerId}/slots`, { params });
  }

  getNextAvailableDate(practitionerId: number, specialtyId: number): Observable<{ nextDate: string }> {
    const params = new HttpParams().set('specialtyId', specialtyId);
    return this.http.get<{ nextDate: string }>(
      `/api/practitioners/public/${practitionerId}/next-available-date`, { params });
  }

  getMyProfile(): Observable<PractitionerProfileDto> {
    return this.http.get<PractitionerProfileDto>('/api/practitioners/me');
  }

  updateMyProfile(request: UpdatePractitionerProfileRequest): Observable<PractitionerProfileDto> {
    return this.http.put<PractitionerProfileDto>('/api/practitioners/me', request);
  }
}
