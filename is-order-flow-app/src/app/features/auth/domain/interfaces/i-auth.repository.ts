import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { AuthResponse, LoginRequest, RefreshTokenResponse, RegisterRequest } from '../models/auth-response.model';

export interface IAuthRepository {
  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>>;
  register(request: RegisterRequest): Observable<ApiResponse<void>>;
  refreshToken(token: string): Observable<ApiResponse<RefreshTokenResponse>>;
  revokeToken(token: string): Observable<ApiResponse<void>>;
}
