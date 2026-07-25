import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AvailabilityDto, CreateAvailabilityRequest, UpdateAvailabilityRequest } from '../models/availability.model';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  constructor(private http: HttpClient) {}

  getMyAvailabilities(): Observable<AvailabilityDto[]> {
    return this.http.get<AvailabilityDto[]>('/api/availabilities/me');
  }

  getPractitionerAvailabilities(practitionerId: number): Observable<AvailabilityDto[]> {
    return this.http.get<AvailabilityDto[]>(`/api/availabilities/practitioner/${practitionerId}`);
  }

  createAvailability(request: CreateAvailabilityRequest): Observable<AvailabilityDto> {
    return this.http.post<AvailabilityDto>('/api/availabilities', request);
  }

  updateAvailability(id: number, request: UpdateAvailabilityRequest): Observable<AvailabilityDto> {
    return this.http.put<AvailabilityDto>(`/api/availabilities/${id}`, request);
  }

  deleteAvailability(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/availabilities/${id}`);
  }
}
