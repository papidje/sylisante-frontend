import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupportService {
  constructor(private http: HttpClient) {}

  contactAdmin(message: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/support/contact-admin', { message });
  }
}
