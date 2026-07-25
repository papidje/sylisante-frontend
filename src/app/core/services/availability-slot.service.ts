import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AvailabilitySlotDto {
  id: number;
  practitionerId: number;
  practitionerName: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  days: number[];
  dayLabels: string[];
  specificDate: string | null;
  replaced: boolean;
  substituteName: string | null;
  createdAt: string;
}

export interface CreateAvailabilitySlotRequest {
  startTime: string;
  endTime: string;
  recurring: boolean;
  days?: number[];
  specificDate?: string;
  replaced: boolean;
  substituteName?: string;
}

@Injectable({ providedIn: 'root' })
export class AvailabilitySlotService {
  constructor(private http: HttpClient) {}

  getMySlots(): Observable<AvailabilitySlotDto[]> {
    return this.http.get<AvailabilitySlotDto[]>('/api/slots/me');
  }

  createSlot(request: CreateAvailabilitySlotRequest): Observable<AvailabilitySlotDto> {
    return this.http.post<AvailabilitySlotDto>('/api/slots', request);
  }

  deleteSlot(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/slots/${id}`);
  }
}
