import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, take, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/services/Auth.service';
import { FrontendPermissionService } from '../../core/services/frontend-permission.service';

export const permissionGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const frontendPerm = inject(FrontendPermissionService);

  if (!authService.isLoggedIn()) {
    return router.navigate(['/login'], { queryParams: { returnUrl: state.url } }) as Promise<boolean | UrlTree>;
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
