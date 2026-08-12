import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppointmentResponse,
  CancelAppointmentRequest,
  CreateAppointmentRequest,
  SubmitPaymentReferenceRequest,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient) {}

  getMyAppointments(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>('/api/appointments');
  }

  getUpcoming(practitionerId?: number): Observable<AppointmentResponse[]> {
    let params = new HttpParams();
    if (practitionerId != null) {
      params = params.set('practitionerId', practitionerId);
    }
    return this.http.get<AppointmentResponse[]>('/api/appointments/upcoming', { params });
  }

  getPast(practitionerId?: number): Observable<AppointmentResponse[]> {
    let params = new HttpParams();
    if (practitionerId != null) {
      params = params.set('practitionerId', practitionerId);
    }
    return this.http.get<AppointmentResponse[]>('/api/appointments/past', { params });
  }

  getCancelled(practitionerId?: number): Observable<AppointmentResponse[]> {
    let params = new HttpParams();
    if (practitionerId != null) {
      params = params.set('practitionerId', practitionerId);
    }
    return this.http.get<AppointmentResponse[]>('/api/appointments/cancelled', { params });
  }

  getCalendar(from: string, to: string, practitionerId?: number): Observable<AppointmentResponse[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (practitionerId != null) {
      params = params.set('practitionerId', practitionerId);
    }
    return this.http.get<AppointmentResponse[]>('/api/appointments/calendar', { params });
  }

  getAppointmentById(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`/api/appointments/${id}`);
  }

  createAppointment(request: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>('/api/appointments', request);
  }

  submitPaymentReference(appointmentId: number, request: SubmitPaymentReferenceRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`/api/appointments/${appointmentId}/payment-reference`, request);
  }

  validatePayment(appointmentId: number): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`/api/appointments/${appointmentId}/validate-payment`, {});
  }

  markCompleted(appointmentId: number): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`/api/appointments/${appointmentId}/complete`, {});
  }

  cancelAppointment(appointmentId: number, request: CancelAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`/api/appointments/${appointmentId}/cancel`, request);
  }

  refuseAppointment(appointmentId: number, request: CancelAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`/api/appointments/${appointmentId}/refuse`, request);
  }
}
