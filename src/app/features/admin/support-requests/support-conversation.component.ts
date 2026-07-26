import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SupportMessageDto } from '../../../core/models/support.model';
import { SupportConversationPanelComponent } from '../../../shared/components/support-conversation-panel/support-conversation-panel.component';

const POLL_INTERVAL_MS = 10_000;

@Component({
  selector: 'app-support-conversation',
  standalone: true,
  imports: [RouterLink, SupportConversationPanelComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col" style="height: calc(100vh - 4rem);">
      <div class="mb-4 flex-shrink-0">
        <a routerLink="/admin/support-requests"
           class="text-sm text-primary-600 hover:underline">
          ← Retour aux conversations
        </a>
        <h1 class="text-2xl font-bold text-gray-900 mt-3">{{ userName() }}</h1>
        <p class="text-gray-500 text-sm mt-1">Conversation avec l'utilisateur</p>
      </div>

      <div class="card flex-1 min-h-0 flex flex-col p-4">
        <app-support-conversation-panel
          class="flex-1 min-h-0 block"
          [messages]="messages()"
          [loading]="loading()"
          [sending]="sending()"
          [errorMessage]="errorMessage()"
          ownSenderType="ADMIN"
          (send)="onSend($event)" />
      </div>
    </div>
  `,
})
export class SupportConversationComponent implements OnInit, OnDestroy {
  messages = signal<SupportMessageDto[]>([]);
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  userName = signal('');
  private userId = 0;
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('userId'));
    this.adminService.getUserById(this.userId).subscribe({
      next: (detail) => {
        this.userName.set(`${detail.profile.firstName} ${detail.profile.lastName}`);
      },
    });
    this.loadMessages();
    this.pollTimer = setInterval(() => this.loadMessages(true), POLL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  loadMessages(silent = false): void {
    if (!silent) this.loading.set(true);
    this.adminService.getSupportConversationMessages(this.userId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        if (!this.userName() && msgs.length > 0) {
          const userMsg = msgs.find(m => m.senderType === 'USER');
          if (userMsg) this.userName.set(userMsg.senderLabel);
        }
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
    this.adminService.replyToSupportConversation(this.userId, text).subscribe({
      next: () => {
        this.sending.set(false);
        this.loadMessages(true);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Erreur lors de l\'envoi.');
        this.sending.set(false);
      },
    });
  }
}
