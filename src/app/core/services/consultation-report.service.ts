import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConsultationReportDto {
  id: number;
  appointmentId: number;
  practitionerId: number;
  practitionerName: string;
  patientId: number;
  patientName: string;
  appointmentDateTime: string;
  content: string;
  createdAt: string;
}

export interface CreateConsultationReportRequest {
  appointmentId: number;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ConsultationReportService {
  constructor(private http: HttpClient) {}

  createReport(request: CreateConsultationReportRequest): Observable<ConsultationReportDto> {
    return this.http.post<ConsultationReportDto>('/api/consultation-reports', request);
  }

  updateReport(id: number, content: string): Observable<ConsultationReportDto> {
    return this.http.put<ConsultationReportDto>(`/api/consultation-reports/${id}`, { content });
  }

  getMyReports(): Observable<ConsultationReportDto[]> {
    return this.http.get<ConsultationReportDto[]>('/api/consultation-reports/me');
  }

  getReportsForPatient(patientId: number): Observable<ConsultationReportDto[]> {
    return this.http.get<ConsultationReportDto[]>(`/api/consultation-reports/patient/${patientId}`);
  }

  getReportById(id: number): Observable<ConsultationReportDto> {
    return this.http.get<ConsultationReportDto>(`/api/consultation-reports/${id}`);
  }
}
