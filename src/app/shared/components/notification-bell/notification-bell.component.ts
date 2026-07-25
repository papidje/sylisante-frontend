import {
  Component, OnInit, OnDestroy, signal, computed, HostListener, ElementRef
} from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import {
  NotificationDto,
  NOTIFICATION_ICONS,
  notificationRoute,
} from '../../../core/models/notification.model';
import { formatIsoDatesInText } from '../../../core/utils/date-utils';

/**
 * Cloche de notification dans le header.
 *
 * - Badge rouge avec le nombre de non lues.
 * - Dropdown avec la liste des 50 dernières notifications.
 * - Clic sur une notification → mark as read + navigation.
 * - Bouton "Tout marquer comme lu".
 * - Fermeture au clic en dehors.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [],
  template: `
    <div class="relative">
      <!-- Bouton cloche -->
      <button (click)="toggleDropdown()"
              class="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              [class.bg-gray-100]="isOpen()"
              [attr.aria-label]="'Notifications (' + notificationService.unreadCount() + ' non lues)'">

        <!-- Icône cloche SVG -->
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>

        <!-- Badge non lues -->
        @if (notificationService.unreadCount() > 0) {
          <span class="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center
                       min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold
                       rounded-full leading-none">
            {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div class="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200
                    z-50 overflow-hidden"
             style="max-height: 500px;">

          <!-- En-tête dropdown -->
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 text-sm">Notifications</h3>
              @if (notificationService.unreadCount() > 0) {
                <span class="inline-flex items-center justify-center px-2 py-0.5 bg-red-100 text-red-700
                             text-xs font-bold rounded-full">
                  {{ notificationService.unreadCount() }} non lue{{ notificationService.unreadCount() !== 1 ? 's' : '' }}
                </span>
              }
            </div>
            @if (notificationService.unreadCount() > 0) {
              <button (click)="markAllRead()"
                      class="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Tout marquer lu
              </button>
            }
          </div>

          <!-- Liste des notifications -->
          <div class="overflow-y-auto" style="max-height: 400px;">
            @if (notificationService.notifications().length === 0) {
              <div class="px-4 py-8 text-center text-gray-400">
                <svg class="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <p class="text-sm">Aucune notification</p>
              </div>
            } @else {
              @for (notif of notificationService.notifications(); track notif.id) {
                <div (click)="handleClick(notif)"
                     class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                            hover:bg-gray-50 border-b border-gray-50"
                     [class.bg-blue-50]="!notif.isRead">
                  <!-- Icône type -->
                  <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
                       [class]="!notif.isRead ? 'bg-primary-100' : 'bg-gray-100'">
                    {{ icon(notif.type) }}
                  </div>
                  <!-- Contenu -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">{{ notif.title }}</p>
                    <p class="text-xs text-gray-600 mt-0.5 line-clamp-2">{{ formatMessage(notif.message) }}</p>
                    <p class="text-[10px] text-gray-400 mt-1">{{ formatTime(notif.createdAt) }}</p>
                  </div>
                  <!-- Point non lu -->
                  @if (!notif.isRead) {
                    <div class="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary-500"></div>
                  }
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  isOpen = signal(false);

  constructor(
    public notificationService: NotificationService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {}
  ngOnDestroy(): void {}

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  /** Ferme le dropdown si clic en dehors du composant. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  handleClick(notif: NotificationDto): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe();
    }
    const route = notificationRoute(notif);
    if (route) {
      this.router.navigateByUrl(route);
    }
    this.isOpen.set(false);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  icon(type: string): string {
    return NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] ?? '🔔';
  }

  formatMessage(message: string): string {
    return formatIsoDatesInText(message);
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    // Afficher le temps relatif : "il y a X min/h/j"
    const now = Date.now();
    const date = new Date(iso);
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    return `Il y a ${diffD} jour${diffD > 1 ? 's' : ''}`;
  }
}
