import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

export type AppointmentActionMode = 'cancel' | 'refuse';

@Component({
  selector: 'app-appointment-action-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdropClick()">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100"
             (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-900">{{ title }}</h2>
                <p class="text-sm text-slate-500 mt-1">{{ subtitle }}</p>
              </div>
              <button type="button" (click)="close()"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Fermer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-5 space-y-4">
            <div>
              <label for="reason" class="block text-sm font-medium text-slate-700 mb-1">
                Motif <span class="text-red-500">*</span>
              </label>
              <textarea id="reason" formControlName="reason" rows="3"
                        class="input-field resize-none"
                        [placeholder]="placeholder"></textarea>
              @if (form.get('reason')?.invalid && form.get('reason')?.touched) {
                <p class="text-xs text-red-500 mt-1">Le motif est obligatoire (3 caractères minimum).</p>
              }
            </div>

            <div class="flex gap-3 pt-1">
              <button type="button" (click)="close()" class="btn-secondary flex-1">Retour</button>
              <button type="submit" [disabled]="form.invalid || loading"
                      [class]="mode === 'refuse' ? 'btn-danger flex-1' : 'btn-primary flex-1'">
                {{ confirmLabel }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AppointmentActionModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() mode: AppointmentActionMode = 'cancel';
  @Input() loading = false;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<string>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({ reason: '' });
    }
  }

  get title(): string {
    return this.mode === 'refuse' ? 'Refuser la demande' : 'Annuler le rendez-vous';
  }

  get subtitle(): string {
    return this.mode === 'refuse'
      ? 'Indiquez la raison du refus. Le patient en sera informé.'
      : 'Indiquez la raison de l\'annulation. L\'autre partie en sera informée.';
  }

  get placeholder(): string {
    return this.mode === 'refuse'
      ? 'Ex : créneau indisponible, spécialité non couverte…'
      : 'Ex : empêchement personnel, report souhaité…';
  }

  get confirmLabel(): string {
    return this.mode === 'refuse' ? 'Confirmer le refus' : 'Confirmer l\'annulation';
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmed.emit(this.form.value.reason.trim());
  }
}
