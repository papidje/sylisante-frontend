import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CityDto, SpecialtyDto } from '../models/city.model';

/**
 * Service public — données de référence accessibles sans authentification.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  constructor(private http: HttpClient) {}

  getCities(): Observable<CityDto[]> {
    return this.http.get<CityDto[]>('/api/cities/public');
  }

  getSpecialties(): Observable<SpecialtyDto[]> {
    return this.http.get<SpecialtyDto[]>('/api/specialties/public');
  }
}
