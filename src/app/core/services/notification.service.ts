import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationDto, NotificationPage } from '../models/notification.model';

/**
 * Service de gestion des notifications en temps réel (SSE) et REST.
 *
 * SSE flow :
 *   connect(token) → ouvre EventSource → reçoit événements "NOTIFICATION"
 *   disconnect()   → ferme la connexion
 *
 * Polling de secours toutes les 20s si le SSE est indisponible (proxy dev, etc.).
 * Reconnexion SSE automatique avec back-off exponentiel (max 30s).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly base = '/api/notifications';
  private readonly POLL_INTERVAL_MS = 20_000;

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 5000;
  private currentToken: string | null = null;

  /** Liste locale des notifications (signal réactif). */
  readonly notifications = signal<NotificationDto[]>([]);
  /** Nombre de non lues calculé localement pour éviter un aller-retour réseau. */
  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.isRead).length
  );

  constructor(private http: HttpClient) {}

  // ── SSE ──────────────────────────────────────────────────────────────────

  connect(token: string): void {
    this.currentToken = token;
    this.openEventSource(token);
    this.startPolling();
    this.loadAll().subscribe();
  }

  private openEventSource(token: string): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const url = `${this.base}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    this.eventSource = es;
    this.reconnectDelay = 5000;

    es.addEventListener('NOTIFICATION', (event: MessageEvent) => {
      try {
        const notif: NotificationDto = JSON.parse(event.data);
        this.prependNotification(notif);
      } catch { /* json parse error — ignore */ }
    });

    es.addEventListener('CONNECTED', () => {
      this.reconnectDelay = 5000;
    });

    es.onerror = () => {
      es.close();
      this.eventSource = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (!this.currentToken) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentToken) {
        this.openEventSource(this.currentToken);
      }
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.refreshFromServer().subscribe();
    }, this.POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPolling();
    this.eventSource?.close();
    this.eventSource = null;
    this.currentToken = null;
    this.notifications.set([]);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /** Met à jour le token SSE après refresh JWT. */
  reconnect(token: string): void {
    this.currentToken = token;
    this.openEventSource(token);
  }

  // ── REST ──────────────────────────────────────────────────────────────────

  loadAll(page = 0, size = 50): Observable<NotificationPage> {
    return this.http.get<NotificationPage>(this.base, {
      params: { page, size }
    }).pipe(
      tap(res => {
        if (page === 0) {
          this.mergeNotifications(res.content);
        } else {
          this.notifications.update(list => this.mergeLists(list, res.content));
        }
      })
    );
  }

  refreshFromServer(): Observable<NotificationPage> {
    return this.loadAll();
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.base}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      })
    );
  }

  private prependNotification(notif: NotificationDto): void {
    this.notifications.update(list => {
      if (list.some(n => n.id === notif.id)) {
        return list.map(n => n.id === notif.id ? notif : n);
      }
      return [notif, ...list];
    });
  }

  private mergeNotifications(incoming: NotificationDto[]): void {
    this.notifications.set(this.sortByDate(this.mergeLists([], incoming)));
  }

  private mergeLists(current: NotificationDto[], incoming: NotificationDto[]): NotificationDto[] {
    const byId = new Map<number, NotificationDto>();
    for (const n of current) byId.set(n.id, n);
    for (const n of incoming) byId.set(n.id, n);
    return this.sortByDate([...byId.values()]);
  }

  private sortByDate(list: NotificationDto[]): NotificationDto[] {
    return list.sort((a, b) => {
      const ta = Date.parse(a.createdAt);
      const tb = Date.parse(b.createdAt);
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
  }
}
