import { Injectable, signal, computed } from '@angular/core';
import { LinkedPractitioner } from '../models/secretary.model';

const STORAGE_KEY = 'sylisante_selected_practitioner';

@Injectable({ providedIn: 'root' })
export class SecretaryContextService {
  private readonly _practitioners = signal<LinkedPractitioner[]>([]);
  private readonly _selectedPractitionerId = signal<number | null>(this.loadStored());

  readonly practitioners = this._practitioners.asReadonly();
  readonly selectedPractitionerId = this._selectedPractitionerId.asReadonly();

  readonly selectedPractitioner = computed(() => {
    const id = this._selectedPractitionerId();
    return this._practitioners().find(p => p.practitionerId === id) ?? null;
  });

  readonly hasNoPractitionerAccess = computed(() => this._practitioners().length === 0);

  /** Met à jour la liste et bascule sur le premier praticien valide si nécessaire. */
  applyPractitioners(list: LinkedPractitioner[]): void {
    this._practitioners.set(list);
    const current = this._selectedPractitionerId();
    if (list.length === 0) {
      this.setSelectedPractitionerId(null);
      return;
    }
    if (!current || !list.some(p => p.practitionerId === current)) {
      this.setSelectedPractitionerId(list[0].practitionerId);
    }
  }

  setPractitioners(list: LinkedPractitioner[]): void {
    this.applyPractitioners(list);
  }

  setSelectedPractitionerId(id: number | null): void {
    this._selectedPractitionerId.set(id);
    if (id != null) {
      localStorage.setItem(STORAGE_KEY, String(id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private loadStored(): number | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
