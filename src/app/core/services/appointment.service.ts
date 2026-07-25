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

  getUpcoming(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>('/api/appointments/upcoming');
  }

  getPast(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>('/api/appointments/past');
  }

  getCancelled(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>('/api/appointments/cancelled');
  }

  getCalendar(from: string, to: string): Observable<AppointmentResponse[]> {
    const params = new HttpParams().set('from', from).set('to', to);
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
