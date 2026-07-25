import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUserDto, UserStatus } from '../models/user.model';
import { CityDto, SpecialtyDto } from '../models/city.model';
import { PlanningAlertDto } from '../models/planning-alert.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  // Users
  getAllUsers(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>('/api/admin/users');
  }
  getPatients(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>('/api/admin/users/patients');
  }
  getPractitioners(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>('/api/admin/users/practitioners');
  }
  updateUserStatus(userId: number, status: UserStatus): Observable<AdminUserDto> {
    return this.http.patch<AdminUserDto>(`/api/admin/users/${userId}/status`, { status });
  }

  // Cities
  getAllCities(): Observable<CityDto[]> {
    return this.http.get<CityDto[]>('/api/admin/cities');
  }
  createCity(name: string): Observable<CityDto> {
    return this.http.post<CityDto>('/api/admin/cities', { name });
  }
  toggleCity(id: number): Observable<CityDto> {
    return this.http.patch<CityDto>(`/api/admin/cities/${id}/toggle`, {});
  }
  deleteCity(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/cities/${id}`);
  }

  // Specialties
  getAllSpecialties(): Observable<SpecialtyDto[]> {
    return this.http.get<SpecialtyDto[]>('/api/admin/specialties');
  }
  createSpecialty(name: string): Observable<SpecialtyDto> {
    return this.http.post<SpecialtyDto>('/api/admin/specialties', { name });
  }
  toggleSpecialty(id: number): Observable<SpecialtyDto> {
    return this.http.patch<SpecialtyDto>(`/api/admin/specialties/${id}/toggle`, {});
  }
  deleteSpecialty(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/specialties/${id}`);
  }

  // Planning alerts (admin view)
  getAllUnresolvedAlerts(): Observable<PlanningAlertDto[]> {
    return this.http.get<PlanningAlertDto[]>('/api/admin/planning-alerts');
  }
  resolveAlert(alertId: number): Observable<PlanningAlertDto> {
    return this.http.patch<PlanningAlertDto>(`/api/admin/planning-alerts/${alertId}/resolve`, {});
  }
}
