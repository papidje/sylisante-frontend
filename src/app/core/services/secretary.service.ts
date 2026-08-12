import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  InviteSecretaryRequest,
  LinkedPractitioner,
  SecretaryInvitation,
  SecretaryRelation,
} from '../models/secretary.model';

@Injectable({ providedIn: 'root' })
export class SecretaryService {
  constructor(private http: HttpClient) {}

  inviteSecretary(request: InviteSecretaryRequest): Observable<SecretaryRelation> {
    return this.http.post<SecretaryRelation>('/api/practitioner/secretaries/invite', request);
  }

  listSecretaries(): Observable<SecretaryRelation[]> {
    return this.http.get<SecretaryRelation[]>('/api/practitioner/secretaries');
  }

  getPendingInvitations(): Observable<SecretaryInvitation[]> {
    return this.http.get<SecretaryInvitation[]>('/api/secretary/invitations');
  }

  acceptInvitation(id: number): Observable<SecretaryInvitation> {
    return this.http.post<SecretaryInvitation>(`/api/secretary/invitations/${id}/accept`, {});
  }

  rejectInvitation(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/secretary/invitations/${id}/reject`, {});
  }

  getLinkedPractitioners(): Observable<LinkedPractitioner[]> {
    return this.http.get<LinkedPractitioner[]>('/api/secretary/practitioners');
  }

  suspendSecretary(relationId: number): Observable<SecretaryRelation> {
    return this.http.put<SecretaryRelation>(`/api/practitioner/secretaries/${relationId}/suspend`, {});
  }

  reactivateSecretary(relationId: number): Observable<SecretaryRelation> {
    return this.http.put<SecretaryRelation>(`/api/practitioner/secretaries/${relationId}/reactivate`, {});
  }
}
