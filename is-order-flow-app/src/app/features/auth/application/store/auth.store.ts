import { computed, Injectable, signal } from '@angular/core';
import { StorageService } from '../../../../core/services/storage.service';
import { inject } from '@angular/core';
import { REFRESH_TOKEN_KEY } from '../../../../shared/constants/app.constants';
import { User } from '../../domain/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly storage = inject(StorageService);

  private readonly _accessToken = signal<string | null>(null);
  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly userEmail = computed(() => this._user()?.email ?? '');

  refreshToken(): string | null {
    return this.storage.getItem(REFRESH_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    this._accessToken.set(token);
  }

  setUser(user: User): void {
    this._user.set(user);
  }

  setRefreshToken(token: string): void {
    this.storage.setItem(REFRESH_TOKEN_KEY, token);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  clearTokens(): void {
    this._accessToken.set(null);
    this._user.set(null);
    this.storage.removeItem(REFRESH_TOKEN_KEY);
  }
}
