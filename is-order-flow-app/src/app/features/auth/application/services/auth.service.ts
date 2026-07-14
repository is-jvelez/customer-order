import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { AuthStore } from '../store/auth.store';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoginRequest, RegisterRequest } from '../../domain/models/auth-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repo = inject(AuthRepository);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  initializeAuth(): void {
    const refreshToken = this.store.refreshToken();
    if (!refreshToken) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.repo.refreshToken(refreshToken).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.store.setAccessToken(res.data.accessToken);
          this.loadCurrentUser();
        } else {
          this.store.clearTokens();
          this.router.navigate(['/auth/login']);
        }
      },
      error: () => {
        this.store.clearTokens();
        this.router.navigate(['/auth/login']);
      },
    });
  }

  login(request: LoginRequest): void {
    this.store.setLoading(true);
    this.store.setError(null);
    this.repo.login(request).subscribe({
      next: (res) => {
        this.store.setLoading(false);
        if (res.success && res.data) {
          this.store.setAccessToken(res.data.accessToken);
          this.store.setRefreshToken(res.data.refreshToken);
          this.store.setUser(res.data.user);
          this.router.navigate(['/dashboard']);
        } else {
          this.store.setError(res.message || 'Credenciales inválidas');
        }
      },
      error: () => {
        this.store.setLoading(false);
        this.store.setError('Credenciales inválidas');
      },
    });
  }

  register(request: RegisterRequest, onSuccess: () => void): void {
    this.store.setLoading(true);
    this.store.setError(null);
    this.repo.register(request).subscribe({
      next: (res) => {
        this.store.setLoading(false);
        if (res.success) {
          onSuccess();
        } else {
          this.store.setError(res.message || 'Error al registrar');
        }
      },
      error: () => {
        this.store.setLoading(false);
        this.store.setError('Error al registrar el usuario');
      },
    });
  }

  logout(): void {
    const refreshToken = this.store.refreshToken();
    if (refreshToken) {
      this.repo.revokeToken(refreshToken).subscribe();
    }
    this.store.clearTokens();
    this.router.navigate(['/auth/login']);
  }

  private loadCurrentUser(): void {
    this.repo.me().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.store.setUser(res.data);
        }
      },
    });
  }
}
