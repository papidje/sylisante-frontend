import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupportService } from '../../../core/services/support.service';
import { SupportMessageDto } from '../../../core/models/support.model';
import { SupportConversationPanelComponent } from '../../../shared/components/support-conversation-panel/support-conversation-panel.component';

const POLL_INTERVAL_MS = 10_000;

@Component({
  selector: 'app-contact-admin',
  standalone: true,
  imports: [RouterLink, SupportConversationPanelComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col" style="height: calc(100vh - 4rem);">
      <div class="mb-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contacter l'admin</h1>
          <p class="text-gray-500 mt-1 text-sm">
            @if (readOnly()) {
              Historique de vos échanges avec l'équipe SyliSanté
            } @else {
              Échangez avec l'équipe SyliSanté
            }
          </p>
        </div>
        @if (authService.isAccountRestricted()) {
          <a routerLink="/account-restricted"
             class="text-sm text-primary-600 hover:underline whitespace-nowrap">
            ← Retour
          </a>
        }
      </div>

      @if (readOnly()) {
        <div class="mb-4 flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Consultation de l'historique uniquement. L'envoi de nouveaux messages n'est pas disponible pour votre compte.
        </div>
      }

      <div class="card flex-1 min-h-0 flex flex-col p-4">
        <app-support-conversation-panel
          class="flex-1 min-h-0 block"
          [messages]="messages()"
          [loading]="loading()"
          [sending]="sending()"
          [showComposer]="canSend()"
          [errorMessage]="errorMessage()"
          ownSenderType="USER"
          (send)="onSend($event)" />
      </div>
    </div>
  `,
})
export class ContactAdminComponent implements OnInit, OnDestroy {
  messages = signal<SupportMessageDto[]>([]);
  canSend = signal(true);
  readOnly = signal(false);
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(
    private supportService: SupportService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadConversation();
    this.pollTimer = setInterval(() => this.loadConversation(true), POLL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  loadConversation(silent = false): void {
    if (!silent) this.loading.set(true);
    this.supportService.getMyConversation().subscribe({
      next: (view) => {
        this.messages.set(view.messages);
        this.canSend.set(view.canSend);
        this.readOnly.set(view.readOnly);
        if (!silent) this.loading.set(false);
      },
      error: () => {
        if (!silent) this.loading.set(false);
      },
    });
  }

  onSend(text: string): void {
    this.sending.set(true);
    this.errorMessage.set('');
    this.supportService.sendMessage(text).subscribe({
      next: () => {
        this.sending.set(false);
        this.loadConversation(true);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Erreur lors de l\'envoi.');
        this.sending.set(false);
      },
    });
  }
}
