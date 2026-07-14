import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAuthRepository } from '../domain/interfaces/i-auth.repository';
import { ApiResponse } from '../../../core/models/api-response.model';
import { AuthResponse, LoginRequest, RefreshTokenResponse, RegisterRequest } from '../domain/models/auth-response.model';
import { AUTH_ROUTES } from '../../../shared/constants/api-routes.constants';

@Injectable({ providedIn: 'root' })
export class AuthRepository implements IAuthRepository {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(AUTH_ROUTES.LOGIN, request);
  }

  register(request: RegisterRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(AUTH_ROUTES.REGISTER, request);
  }

  refreshToken(token: string): Observable<ApiResponse<RefreshTokenResponse>> {
    return this.http.post<ApiResponse<RefreshTokenResponse>>(AUTH_ROUTES.REFRESH_TOKEN, { refreshToken: token });
  }

  revokeToken(token: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(AUTH_ROUTES.REVOKE_TOKEN, { refreshToken: token });
  }

  me(): Observable<ApiResponse<AuthResponse['user']>> {
    return this.http.get<ApiResponse<AuthResponse['user']>>(AUTH_ROUTES.ME);
  }
}
