import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TransferResponse,
  InitiateTransferRequest,
  ApproveTransferRequest,
  SharedReportDto,
} from '../models/transfer.model';

@Injectable({ providedIn: 'root' })
export class ReportTransferService {
  private readonly base = '/api/report-transfers';

  constructor(private http: HttpClient) {}

  // Patient
  initiateTransfer(request: InitiateTransferRequest): Observable<TransferResponse> {
    return this.http.post<TransferResponse>(this.base, request);
  }

  getMyTransfers(): Observable<TransferResponse[]> {
    return this.http.get<TransferResponse[]>(`${this.base}/my-requests`);
  }

  cancelTransfer(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}/cancel`);
  }

  // Source practitioner
  getPendingApprovals(): Observable<TransferResponse[]> {
    return this.http.get<TransferResponse[]>(`${this.base}/pending-approvals`);
  }

  getPendingCount(): Observable<{ pendingCount: number }> {
    return this.http.get<{ pendingCount: number }>(`${this.base}/pending-count`);
  }

  getSelectableReports(transferId: number): Observable<SharedReportDto[]> {
    return this.http.get<SharedReportDto[]>(`${this.base}/${transferId}/selectable-reports`);
  }

  approveTransfer(transferId: number, request: ApproveTransferRequest): Observable<TransferResponse> {
    return this.http.post<TransferResponse>(`${this.base}/${transferId}/approve`, request);
  }

  rejectTransfer(transferId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${transferId}/reject`, {});
  }

  // Target practitioner
  getReceivedTransfers(): Observable<TransferResponse[]> {
    return this.http.get<TransferResponse[]>(`${this.base}/received`);
  }

  getTransferDetails(transferId: number): Observable<TransferResponse> {
    return this.http.get<TransferResponse>(`${this.base}/${transferId}/details`);
  }
}
