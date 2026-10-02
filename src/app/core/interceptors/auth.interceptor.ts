import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/Auth.service';

let refreshInFlight: Promise<string | null> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  let cloned = req.clone({ withCredentials: true });
  if (token) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  const skipRefresh =
    req.url.includes('/Auth/refresh') ||
    req.url.includes('/Auth/login') ||
    req.url.includes('/Auth/register') ||
    req.url.includes('/Auth/tenant') ||
    req.url.includes('/Branding/public');

  return next(cloned).pipe(
    catchError((err) => {
      if (err.status !== 401 || skipRefresh) {
        return throwError(() => err);
      }

      if (!refreshInFlight) {
        refreshInFlight = new Promise((resolve) => {
          auth.refresh().subscribe({
            next: (res) => {
              const nextToken = res?.data?.token || res?.data?.Token;
              if (nextToken) {
                auth.persistLogin(res.data);
                resolve(nextToken);
              } else {
                resolve(null);
              }
              refreshInFlight = null;
            },
            error: () => {
              refreshInFlight = null;
              resolve(null);
            }
          });
        });
      }

      return from(refreshInFlight).pipe(
        switchMap((newToken) => {
          if (!newToken) {
            return throwError(() => err);
          }
          return next(req.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${newToken}` }
          }));
        })
      );
    })
  );
};
