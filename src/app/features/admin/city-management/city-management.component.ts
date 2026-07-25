import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { CityDto, SpecialtyDto } from '../../../core/models/city.model';

@Component({
  selector: 'app-city-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Villes & Spécialités</h1>
        <p class="text-gray-500 mt-1">Gérez les référentiels de la plateforme</p>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">

        <!-- Gestion des Villes -->
        <div>
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">
                Villes de Guinée
                <span class="text-sm font-normal text-gray-500 ml-2">({{ cities().length }})</span>
              </h2>
            </div>

            <!-- Formulaire ajout ville -->
            <div class="flex gap-2 mb-4">
              <input type="text" [(ngModel)]="newCityName" placeholder="Nom de la ville..."
                     class="input-field text-sm flex-1"
                     (keyup.enter)="addCity()"/>
              <button (click)="addCity()" [disabled]="!newCityName.trim() || addingCity()"
                      class="btn-primary text-sm px-4">
                + Ajouter
              </button>
            </div>

            @if (errorCity()) {
              <p class="text-sm text-red-600 mb-3">{{ errorCity() }}</p>
            }

            <div class="max-h-80 overflow-y-auto space-y-1.5">
              @for (city of cities(); track city.id) {
                <div class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 group">
                  <span class="text-sm" [class.text-gray-400]="!city.active"
                        [class.line-through]="!city.active">
                    {{ city.name }}
                  </span>
                  <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="toggleCity(city)"
                            class="text-xs px-2 py-0.5 rounded border transition-colors"
                            [class.border-sky-300]="!city.active"
                            [class.text-sky-700]="!city.active"
                            [class.border-red-200]="city.active"
                            [class.text-red-600]="city.active">
                      {{ city.active ? 'Désactiver' : 'Activer' }}
                    </button>
                    <button (click)="deleteCity(city.id)"
                            class="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Gestion des Spécialités -->
        <div>
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">
                Spécialités médicales
                <span class="text-sm font-normal text-gray-500 ml-2">({{ specialties().length }})</span>
              </h2>
            </div>

            <!-- Formulaire ajout spécialité -->
            <div class="flex gap-2 mb-4">
              <input type="text" [(ngModel)]="newSpecialtyName" placeholder="Nom de la spécialité..."
                     class="input-field text-sm flex-1"
                     (keyup.enter)="addSpecialty()"/>
              <button (click)="addSpecialty()" [disabled]="!newSpecialtyName.trim() || addingSpecialty()"
                      class="btn-primary text-sm px-4">
                + Ajouter
              </button>
            </div>

            @if (errorSpecialty()) {
              <p class="text-sm text-red-600 mb-3">{{ errorSpecialty() }}</p>
            }

            <div class="max-h-80 overflow-y-auto space-y-1.5">
              @for (specialty of specialties(); track specialty.id) {
                <div class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 group">
                  <span class="text-sm" [class.text-gray-400]="!specialty.active"
                        [class.line-through]="!specialty.active">
                    {{ specialty.name }}
                  </span>
                  <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="toggleSpecialty(specialty)"
                            class="text-xs px-2 py-0.5 rounded border transition-colors"
                            [class.border-sky-300]="!specialty.active"
                            [class.text-sky-700]="!specialty.active"
                            [class.border-red-200]="specialty.active"
                            [class.text-red-600]="specialty.active">
                      {{ specialty.active ? 'Désactiver' : 'Activer' }}
                    </button>
                    <button (click)="deleteSpecialty(specialty.id)"
                            class="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CityManagementComponent implements OnInit {
  cities = signal<CityDto[]>([]);
  specialties = signal<SpecialtyDto[]>([]);
  newCityName = '';
  newSpecialtyName = '';
  addingCity = signal(false);
  addingSpecialty = signal(false);
  errorCity = signal('');
  errorSpecialty = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAllCities().subscribe(cities => this.cities.set(cities));
    this.adminService.getAllSpecialties().subscribe(s => this.specialties.set(s));
  }

  addCity(): void {
    if (!this.newCityName.trim()) return;
    this.addingCity.set(true);
    this.errorCity.set('');
    this.adminService.createCity(this.newCityName.trim()).subscribe({
      next: (city) => {
        this.cities.update(list => [...list, city].sort((a, b) => a.name.localeCompare(b.name)));
        this.newCityName = '';
        this.addingCity.set(false);
      },
      error: (err) => {
        this.errorCity.set(err.error?.detail || 'Erreur lors de l\'ajout.');
        this.addingCity.set(false);
      },
    });
  }

  toggleCity(city: CityDto): void {
    this.adminService.toggleCity(city.id).subscribe(updated => {
      this.cities.update(list => list.map(c => c.id === updated.id ? updated : c));
    });
  }

  deleteCity(id: number): void {
    this.adminService.deleteCity(id).subscribe(() => {
      this.cities.update(list => list.filter(c => c.id !== id));
    });
  }

  addSpecialty(): void {
    if (!this.newSpecialtyName.trim()) return;
    this.addingSpecialty.set(true);
    this.errorSpecialty.set('');
    this.adminService.createSpecialty(this.newSpecialtyName.trim()).subscribe({
      next: (specialty) => {
        this.specialties.update(list => [...list, specialty].sort((a, b) => a.name.localeCompare(b.name)));
        this.newSpecialtyName = '';
        this.addingSpecialty.set(false);
      },
      error: (err) => {
        this.errorSpecialty.set(err.error?.detail || 'Erreur lors de l\'ajout.');
        this.addingSpecialty.set(false);
      },
    });
  }

  toggleSpecialty(specialty: SpecialtyDto): void {
    this.adminService.toggleSpecialty(specialty.id).subscribe(updated => {
      this.specialties.update(list => list.map(s => s.id === updated.id ? updated : s));
    });
  }

  deleteSpecialty(id: number): void {
    this.adminService.deleteSpecialty(id).subscribe(() => {
      this.specialties.update(list => list.filter(s => s.id !== id));
    });
  }
}
