import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientSearchResult } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private http: HttpClient) {}

  search(query: string): Observable<PatientSearchResult[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<PatientSearchResult[]>('/api/patients/search', { params });
  }
}
