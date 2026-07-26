import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupportService } from '../../../core/services/support.service';
import { SupportMessageDto } from '../../../core/models/support.model';
import { SupportConversationPanelComponent } from '../../../shared/components/support-conversation-panel/support-conversation-panel.component';

@Component({
  selector: 'app-contact-admin',
  standalone: true,
  imports: [RouterLink, SupportConversationPanelComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contacter l'administrateur</h1>
          <p class="text-gray-500 mt-1 text-sm">Échangez avec l'équipe SyliSanté</p>
        </div>
        @if (authService.isAccountRestricted()) {
          <a routerLink="/account-restricted"
             class="text-sm text-primary-600 hover:underline whitespace-nowrap">
            ← Retour
          </a>
        }
      </div>

      <div class="card min-h-[500px] flex flex-col">
        <app-support-conversation-panel
          [messages]="messages()"
          [loading]="loading()"
          [sending]="sending()"
          [errorMessage]="errorMessage()"
          (send)="onSend($event)" />
      </div>
    </div>
  `,
})
export class ContactAdminComponent implements OnInit {
  messages = signal<SupportMessageDto[]>([]);
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');

  constructor(
    private supportService: SupportService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading.set(true);
    this.supportService.getMyMessages().subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSend(text: string): void {
    this.sending.set(true);
    this.errorMessage.set('');
    this.supportService.sendMessage(text).subscribe({
      next: (msg) => {
        this.messages.update(list => [msg, ...list]);
        this.sending.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Erreur lors de l\'envoi.');
        this.sending.set(false);
      },
    });
  }
}
