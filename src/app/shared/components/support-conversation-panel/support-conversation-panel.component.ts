import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportMessageDto } from '../../../core/models/support.model';
import { SyliSpinnerComponent } from '../syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-support-conversation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SyliSpinnerComponent],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <!-- Fil scrollable — anciens en haut, récents en bas -->
      <div #scrollContainer
           class="flex-1 min-h-0 overflow-y-auto space-y-3 px-1 py-3">
        @if (loading && sortedMessages.length === 0) {
          <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
        } @else if (sortedMessages.length === 0) {
          <div class="text-center py-12 text-gray-400 text-sm">
            Aucun message pour le moment.<br/>Envoyez votre première demande ci-dessous.
          </div>
        } @else {
          @for (msg of sortedMessages; track msg.id) {
            <div class="flex" [class.justify-end]="isOwnMessage(msg)"
                 [class.justify-start]="!isOwnMessage(msg)">
              <div class="max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm"
                   [class.bg-primary-600]="isOwnMessage(msg)"
                   [class.text-white]="isOwnMessage(msg)"
                   [class.bg-white]="!isOwnMessage(msg)"
                   [class.border]="!isOwnMessage(msg)"
                   [class.border-gray-200]="!isOwnMessage(msg)"
                   [class.text-gray-800]="!isOwnMessage(msg)">
                <p class="text-[10px] font-medium mb-1 opacity-75">{{ msg.senderLabel }}</p>
                <p class="text-sm whitespace-pre-wrap break-words">{{ msg.body }}</p>
                <p class="text-[10px] mt-1.5 opacity-60 text-right">{{ formatTime(msg.createdAt) }}</p>
              </div>
            </div>
          }
        }
      </div>

      <!-- Zone de saisie fixe en bas -->
      @if (showComposer) {
        <div class="flex-shrink-0 border-t border-gray-100 pt-3 pb-1 bg-white">
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
export class SupportConversationPanelComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() messages: SupportMessageDto[] = [];
  @Input() loading = false;
  @Input() sending = false;
  @Input() showComposer = true;
  @Input() errorMessage = '';
  /** true = bulles utilisateur à droite (vue patient/praticien), false = admin à droite */
  @Input() ownSenderType: 'USER' | 'ADMIN' = 'USER';

  @Output() send = new EventEmitter<string>();

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  draft = '';
  sortedMessages: SupportMessageDto[] = [];

  private stickToBottom = true;
  private scrollListener?: () => void;
  private readonly scrollThreshold = 80;

  ngAfterViewInit(): void {
    this.attachScrollListener();
  }

  ngOnDestroy(): void {
    this.detachScrollListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      const previous = (changes['messages'].previousValue as SupportMessageDto[] | undefined) ?? [];
      const isFirstLoad = previous.length === 0 && this.messages.length > 0;

      this.sortedMessages = [...this.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      if (isFirstLoad || this.stickToBottom) {
        this.scrollToBottom();
      }
    }
  }

  isOwnMessage(msg: SupportMessageDto): boolean {
    return msg.senderType === this.ownSenderType;
  }

  submit(): void {
    const text = this.draft.trim();
    if (!text || this.sending) return;
    this.stickToBottom = true;
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

  private attachScrollListener(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el || this.scrollListener) return;

    this.scrollListener = () => this.updateStickToBottom();
    el.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  private detachScrollListener(): void {
    const el = this.scrollContainer?.nativeElement;
    if (el && this.scrollListener) {
      el.removeEventListener('scroll', this.scrollListener);
    }
    this.scrollListener = undefined;
  }

  private updateStickToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= this.scrollThreshold;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
        this.stickToBottom = true;
      }
    }, 0);
  }
}
