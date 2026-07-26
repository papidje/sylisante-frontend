import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportMessageDto } from '../../../core/models/support.model';
import { SyliSpinnerComponent } from '../syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-support-conversation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SyliSpinnerComponent],
  template: `
    <div class="flex flex-col h-full min-h-[420px]">
      <!-- Fil de messages (du plus récent au plus ancien) -->
      <div class="flex-1 overflow-y-auto space-y-3 px-1 py-2" #scrollContainer>
        @if (loading) {
          <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
        } @else if (messages.length === 0) {
          <div class="text-center py-12 text-gray-400 text-sm">
            Aucun message pour le moment.<br/>Envoyez votre première demande ci-dessous.
          </div>
        } @else {
          @for (msg of messages; track msg.id) {
            <div class="flex" [class.justify-end]="msg.senderType === 'USER'"
                 [class.justify-start]="msg.senderType === 'ADMIN'">
              <div class="max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm"
                   [class.bg-primary-600]="msg.senderType === 'USER'"
                   [class.text-white]="msg.senderType === 'USER'"
                   [class.bg-white]="msg.senderType === 'ADMIN'"
                   [class.border]="msg.senderType === 'ADMIN'"
                   [class.border-gray-200]="msg.senderType === 'ADMIN'"
                   [class.text-gray-800]="msg.senderType === 'ADMIN'">
                <p class="text-[10px] font-medium mb-1 opacity-75">{{ msg.senderLabel }}</p>
                <p class="text-sm whitespace-pre-wrap break-words">{{ msg.body }}</p>
                <p class="text-[10px] mt-1.5 opacity-60 text-right">{{ formatTime(msg.createdAt) }}</p>
              </div>
            </div>
          }
        }
      </div>

      <!-- Zone de saisie -->
      @if (showComposer) {
        <div class="border-t border-gray-100 pt-4 mt-2">
          @if (errorMessage) {
            <p class="text-sm text-red-600 mb-2">{{ errorMessage }}</p>
          }
          <div class="flex gap-2">
            <textarea [(ngModel)]="draft" rows="2"
                      class="input-field resize-none flex-1 text-sm"
                      placeholder="Votre message…"
                      (keydown.enter)="$event.preventDefault(); submit()"
                      [disabled]="sending"></textarea>
            <button type="button" (click)="submit()"
                    [disabled]="!draft.trim() || sending"
                    class="btn-primary px-4 self-end">
              @if (sending) {
                …
              } @else {
                Envoyer
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class SupportConversationPanelComponent {
  @Input() messages: SupportMessageDto[] = [];
  @Input() loading = false;
  @Input() sending = false;
  @Input() showComposer = true;
  @Input() errorMessage = '';
  @Output() send = new EventEmitter<string>();

  draft = '';

  submit(): void {
    const text = this.draft.trim();
    if (!text || this.sending) return;
    this.send.emit(text);
    this.draft = '';
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const now = Date.now();
      const diffMin = Math.floor((now - d.getTime()) / 60_000);
      if (diffMin < 1) return "À l'instant";
      if (diffMin < 60) return `Il y a ${diffMin} min`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `Il y a ${diffH} h`;
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }
}
