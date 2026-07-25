import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfileDto, UpdateUserProfileRequest, ChangePasswordRequest } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>('/api/users/me');
  }

  updateMyProfile(request: UpdateUserProfileRequest): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>('/api/users/me', request);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>('/api/users/me/password', request);
  }
}
