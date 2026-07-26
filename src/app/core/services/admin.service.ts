import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUserDto, AdminUserDetailDto, AdminSupportRequestDto, UserStatus } from '../models/user.model';
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
  getUserById(userId: number): Observable<AdminUserDetailDto> {
    return this.http.get<AdminUserDetailDto>(`/api/admin/users/${userId}`);
  }
  updateUserStatus(userId: number, status: UserStatus, reason?: string): Observable<AdminUserDto> {
    return this.http.patch<AdminUserDto>(`/api/admin/users/${userId}/status`, { status, reason: reason ?? null });
  }
  approvePractitioner(userId: number, subscriptionExpiresAt: string): Observable<AdminUserDto> {
    return this.http.patch<AdminUserDto>(`/api/admin/users/${userId}/approve-practitioner`, {
      subscriptionExpiresAt,
    });
  }

  getSupportRequests(): Observable<AdminSupportRequestDto[]> {
    return this.http.get<AdminSupportRequestDto[]>('/api/admin/support-requests');
  }
  resolveSupportRequest(requestId: number, adminResponse?: string): Observable<AdminSupportRequestDto> {
    return this.http.patch<AdminSupportRequestDto>(
      `/api/admin/support-requests/${requestId}/resolve`,
      { adminResponse: adminResponse ?? null }
    );
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
