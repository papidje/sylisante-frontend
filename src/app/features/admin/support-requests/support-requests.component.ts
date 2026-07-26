import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { SupportConversationSummaryDto } from '../../../core/models/support.model';
import { ROLE_LABELS, USER_STATUS_LABELS, Role, UserStatus } from '../../../core/models/user.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-support-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Messages utilisateurs</h1>
        <p class="text-gray-500 mt-1">Conversations avec les patients et praticiens</p>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else {
        <div class="card overflow-hidden p-0 divide-y divide-gray-100">
          @for (conv of conversations(); track conv.userId) {
            <button type="button" (click)="openConversation(conv.userId)"
                    class="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex gap-4 items-start">
              <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center
                          font-semibold text-sm flex-shrink-0">
                {{ conv.userFirstName.charAt(0) }}{{ conv.userLastName.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-semibold text-gray-900 truncate">
                    {{ conv.userFirstName }} {{ conv.userLastName }}
                  </p>
                  <span class="text-xs text-gray-400 flex-shrink-0">{{ formatTime(conv.lastMessageAt) }}</span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ getRoleLabel(conv.userRole) }} · {{ getStatusLabel(conv.userStatus) }}
                </p>
                <p class="text-sm text-gray-600 mt-1 truncate">
                  @if (conv.lastMessageSenderType === 'ADMIN') {
                    <span class="text-primary-600 font-medium">Vous : </span>
                  }
                  {{ conv.lastMessagePreview }}
                </p>
              </div>
            </button>
          }
          @if (conversations().length === 0) {
            <div class="px-6 py-16 text-center text-gray-400">
              Aucune conversation pour le moment
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SupportRequestsComponent implements OnInit {
  conversations = signal<SupportConversationSummaryDto[]>([]);
  loading = signal(true);

  constructor(
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.adminService.getSupportConversations().subscribe({
      next: (items) => {
        this.conversations.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openConversation(userId: number): void {
    this.router.navigate(['/admin/support-requests', userId]);
  }

  getRoleLabel(role: string): string {
    return ROLE_LABELS[role as Role] || role;
  }

  getStatusLabel(status: string): string {
    return USER_STATUS_LABELS[status as UserStatus] || status;
  }

  formatTime(iso: string): string {
    return formatLocalDateTime(iso);
  }
}
