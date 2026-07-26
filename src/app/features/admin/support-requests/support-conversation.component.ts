import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SupportMessageDto } from '../../../core/models/support.model';
import { SupportConversationPanelComponent } from '../../../shared/components/support-conversation-panel/support-conversation-panel.component';

@Component({
  selector: 'app-support-conversation',
  standalone: true,
  imports: [RouterLink, SupportConversationPanelComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="mb-6">
        <a routerLink="/admin/support-requests"
           class="text-sm text-primary-600 hover:underline">
          ← Retour aux conversations
        </a>
        <h1 class="text-2xl font-bold text-gray-900 mt-3">{{ userName() }}</h1>
        <p class="text-gray-500 text-sm mt-1">Conversation avec l'utilisateur</p>
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
export class SupportConversationComponent implements OnInit {
  messages = signal<SupportMessageDto[]>([]);
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  userName = signal('');
  private userId = 0;

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
  }

  loadMessages(): void {
    this.loading.set(true);
    this.adminService.getSupportConversationMessages(this.userId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        if (!this.userName() && msgs.length > 0) {
          const userMsg = msgs.find(m => m.senderType === 'USER');
          if (userMsg) this.userName.set(userMsg.senderLabel);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSend(text: string): void {
    this.sending.set(true);
    this.errorMessage.set('');
    this.adminService.replyToSupportConversation(this.userId, text).subscribe({
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
