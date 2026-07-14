import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthStore } from '../../features/auth/application/store/auth.store';
import { AuthRepository } from '../../features/auth/infrastructure/auth.repository';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;
  return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authStore: AuthStore,
  router: Router,
  authRepo: AuthRepository,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(addToken(req, token))),
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  const refreshToken = authStore.refreshToken();
  if (!refreshToken) {
    isRefreshing = false;
    authStore.clearTokens();
    router.navigate(['/auth/login']);
    return throwError(() => new Error('No refresh token'));
  }

  return authRepo.refreshToken(refreshToken).pipe(
    switchMap((response) => {
      isRefreshing = false;
      if (response.success && response.data) {
        const newToken = response.data.accessToken;
        authStore.setAccessToken(newToken);
        refreshTokenSubject.next(newToken);
        return next(addToken(req, newToken));
      }
      authStore.clearTokens();
      router.navigate(['/auth/login']);
      return throwError(() => new Error('Refresh failed'));
    }),
    catchError((err) => {
      isRefreshing = false;
      authStore.clearTokens();
      router.navigate(['/auth/login']);
      return throwError(() => err);
    }),
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const authRepo = inject(AuthRepository);

  const skipUrls = ['/auth/login', '/auth/register', '/auth/refresh-token'];
  if (skipUrls.some((url) => req.url.includes(url))) {
    return next(req);
  }

  const token = authStore.accessToken();
  const authReq = addToken(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401(req, next, authStore, router, authRepo);
      }
      return throwError(() => error);
    }),
  );
};
