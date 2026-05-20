import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, map, shareReplay, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse, RefreshResponse } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REFRESH_KEY = 'auth_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<AuthUser | null>(this.loadUser());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly username = computed(() => this.currentUser()?.username ?? '');
  readonly roles = computed(() => this.currentUser()?.roles ?? []);
  readonly permissions = computed(() => this.currentUser()?.permissions ?? []);

  // In-flight refresh shared across concurrent 401s so the rotating token is spent once.
  private refresh$: Observable<string> | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        const authorities = response.authorities.split(',').map(a => a.trim()).filter(Boolean);
        const roles = authorities.filter(a => a.startsWith('ROLE_'));
        const permissions = authorities.filter(a => !a.startsWith('ROLE_'));
        const user: AuthUser = {
          username: response.username,
          roles,
          permissions,
          token: response.token,
        };
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(REFRESH_KEY, response.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  logout(): void {
    // Best-effort server-side revocation of the refresh token; clear locally regardless.
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post<void>(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        error: () => {},
      });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Exchanges the stored refresh token for a fresh access token (rotating the refresh
   * token as the backend does). Concurrent callers share the same in-flight request.
   * Returns the new access token, or throws if no/invalid refresh token.
   */
  refreshToken(): Observable<string> {
    if (this.refresh$) return this.refresh$;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refresh$ = this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        map(response => {
          localStorage.setItem(TOKEN_KEY, response.token);
          localStorage.setItem(REFRESH_KEY, response.refreshToken);
          const current = this.currentUser();
          if (current) {
            const updated: AuthUser = { ...current, token: response.token };
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            this.currentUser.set(updated);
          }
          return response.token;
        }),
        finalize(() => (this.refresh$ = null)),
        shareReplay(1)
      );
    return this.refresh$;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some(r => this.roles().includes(r));
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
