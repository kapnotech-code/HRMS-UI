import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/Auth.service';
import { FrontendPermissionService } from '../../core/services/frontend-permission.service';
import { SubscriptionEntitlementService } from '../../core/services/subscription-entitlement.service';
import { featureForRoute } from '../../shared/rbac/permission-matrix';

function normalizeUrl(url: string): string {
  const trimmed = url.trim().split('?')[0];
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.toLowerCase();
}

export const permissionGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const frontendPerm = inject(FrontendPermissionService);
  const entitlement = inject(SubscriptionEntitlementService);

  if (!authService.isLoggedIn()) {
    return router.navigate(['/login'], { queryParams: { returnUrl: state.url } }) as Promise<boolean | UrlTree>;
  }

  const currentUrl = normalizeUrl(state.url);

  try {
    await firstValueFrom(frontendPerm.loadMatrix());
    await firstValueFrom(entitlement.load());
  } catch {
    return router.navigate(['/dashboard']) as Promise<boolean | UrlTree>;
  }

  if (currentUrl === '/dashboard' || currentUrl.startsWith('/dashboard/')) {
    return true;
  }

  if (!frontendPerm.canAccessRoute(currentUrl)) {
    return router.navigate(['/dashboard']) as Promise<boolean | UrlTree>;
  }

  const feature = featureForRoute(currentUrl);
  if (feature && !entitlement.hasFeature(feature)) {
    return router.navigate(['/subscriptions/plans']) as Promise<boolean | UrlTree>;
  }

  return true;
};
