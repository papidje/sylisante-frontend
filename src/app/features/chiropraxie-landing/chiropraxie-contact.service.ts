import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChiropraxieContactPayload {
  name: string;
  contact: string;
  message: string;
}

@Injectable()
export class ChiropraxieContactService {
  private readonly endpoint = '/api/v1/public/chiropraxie/contact';

  constructor(private http: HttpClient) {}

  sendContact(payload: ChiropraxieContactPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.endpoint, payload);
  }
}
