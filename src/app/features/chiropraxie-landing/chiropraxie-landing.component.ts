import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { CHIROPRAXIE_SITE } from './chiropraxie-content';
import { ChiropraxieContactService } from './chiropraxie-contact.service';

@Component({
  selector: 'app-chiropraxie-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [ChiropraxieContactService],
  templateUrl: './chiropraxie-landing.component.html',
  styleUrl: './chiropraxie-landing.component.css',
})
export class ChiropraxieLandingComponent {
  readonly site = CHIROPRAXIE_SITE;
  readonly currentYear = new Date().getFullYear();

  contactForm: FormGroup;
  sending = signal(false);
  contactSuccess = signal('');
  contactError = signal('');

  constructor(
    private fb: FormBuilder,
    private contactService: ChiropraxieContactService,
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      contact: ['', [Validators.required, Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.maxLength(5000)]],
    });
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submitContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.contactSuccess.set('');
    this.contactError.set('');

    const value = this.contactForm.value;
    this.contactService.sendContact({
      name: value.name.trim(),
      contact: value.contact.trim(),
      message: value.message.trim(),
    }).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.contactSuccess.set(res.message || 'Votre message a bien été envoyé.');
        this.contactForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        this.contactError.set(err.error?.detail || 'Erreur lors de l\'envoi. Veuillez réessayer ou nous appeler.');
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.contactForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
