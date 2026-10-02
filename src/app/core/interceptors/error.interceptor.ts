import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      const isAuthEndpoint = req.url.includes('/api/Auth');

      if (err.status === 401 && isAuthEndpoint && req.url.includes('/Auth/refresh')) {
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }

      if (err.status === 402) {
        const code = err?.error?.code;
        if (code === 'SUBSCRIPTION_READ_ONLY') {
          router.navigate(['/subscriptions/plans']);
        }
      }

      return throwError(() => err);
    })
  );
};
