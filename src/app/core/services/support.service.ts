import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SupportAccessDto,
  SupportConversationViewDto,
  SupportMessageDto,
} from '../models/support.model';

@Injectable({ providedIn: 'root' })
export class SupportService {
  constructor(private http: HttpClient) {}

  getAccess(): Observable<SupportAccessDto> {
    return this.http.get<SupportAccessDto>('/api/support/access');
  }

  getMyConversation(): Observable<SupportConversationViewDto> {
    return this.http.get<SupportConversationViewDto>('/api/support/messages');
  }

  sendMessage(message: string): Observable<SupportMessageDto> {
    return this.http.post<SupportMessageDto>('/api/support/messages', { message });
  }

  /** Rétrocompatibilité modal rapide */
  contactAdmin(message: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/support/contact-admin', { message });
  }
}
