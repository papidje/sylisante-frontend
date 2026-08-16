import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CHIROPRAXIE_SITE } from '../chiropraxie-content';
import { ChiropraxieContactService } from '../chiropraxie-contact.service';

@Component({
  selector: 'app-chiropraxie-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [ChiropraxieContactService],
  templateUrl: './chiropraxie-contact.component.html',
})
export class ChiropraxieContactComponent {
  readonly site = CHIROPRAXIE_SITE;

  contactForm: FormGroup;
  sending = signal(false);
  contactSuccess = signal('');
  contactError = signal('');

  constructor(
    private fb: FormBuilder,
    private contactService: ChiropraxieContactService,
  ) {
    this.contactForm = this.fb.group({
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.maxLength(50)]],
      subject: ['', [Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.maxLength(5000)]],
    });
  }

  submitContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.contactSuccess.set('');
    this.contactError.set('');

    const v = this.contactForm.value;
    const name = `${v.firstName.trim()} ${v.lastName.trim()}`;
    const contact = v.phone?.trim()
      ? `${v.email.trim()} / ${v.phone.trim()}`
      : v.email.trim();
    const message = v.subject?.trim()
      ? `Sujet : ${v.subject.trim()}\n\n${v.message.trim()}`
      : v.message.trim();

    this.contactService.sendContact({ name, contact, message }).subscribe({
      next: res => {
        this.sending.set(false);
        this.contactSuccess.set(res.message || 'Envoyé !');
        this.contactForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        this.contactError.set(err.error?.detail || 'Erreur serveur');
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.contactForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
