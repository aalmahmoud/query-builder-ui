import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

const isAuthEndpoint = (req: HttpRequest<unknown>): boolean =>
  req.url.includes('/auth/login') ||
  req.url.includes('/auth/refresh') ||
  req.url.includes('/auth/logout');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // On an expired/invalid access token, try a one-shot refresh and replay the request.
      // Skip auth endpoints themselves to avoid a refresh loop.
      if (error.status === 401 && !isAuthEndpoint(req) && authService.getRefreshToken()) {
        return authService.refreshToken().pipe(
          switchMap(newToken =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
          ),
          catchError(() => {
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      if (error.status === 401) {
        authService.logout();
      }
      if (error.status === 403) {
        router.navigate(['/dashboard']);
      }
      return throwError(() => error);
    })
  );
};
