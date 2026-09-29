import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, take, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/services/Auth.service';
import { FrontendPermissionService } from '../../core/services/frontend-permission.service';

// Routes that should always be accessible (bypass permission check)
const BYPASS_ROUTES = new Set<string>([
  '/transactions/schedule-transaction',
  '/transactions/schedule-transaction/',
  '/transactions/schedule-employee',
  '/transactions/schedule-employee/',
  '/masters/schedule-employee',
  '/masters/schedule-employee/',
  '/masters/schedule-master',
  '/masters/schedule-master/'
]);

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.toLowerCase();
}

export const permissionGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const frontendPerm = inject(FrontendPermissionService);

  if (!authService.isLoggedIn()) {
    return router.navigate(['/login'], { queryParams: { returnUrl: state.url } }) as Promise<boolean | UrlTree>;
  }

  // Bypass permission check for known routes
  const normalizedUrl = normalizeUrl(state.url);
  for (const bypassRoute of BYPASS_ROUTES) {
    if (normalizedUrl === bypassRoute || normalizedUrl.startsWith(bypassRoute)) {
      return true;
    }
  }

  const roleId = frontendPerm.getCurrentRoleId();

  if (!roleId || roleId === 1) {
    return true;
  }

  const currentUrl = state.url;

  try {
    await frontendPerm.initialize().toPromise();
    await frontendPerm.loadPermissionsForRole(roleId).toPromise();
  } catch {
    // If permissions fail to load, allow access
    return true;
  }

  if (frontendPerm.canAccessRoute(currentUrl)) {
    return true;
  }

  // Prevent infinite redirect loop when the denied page is the redirect target
  if (currentUrl === '/dashboard') {
    return true;
  }

  return router.navigate(['/dashboard']) as Promise<boolean | UrlTree>;
};
