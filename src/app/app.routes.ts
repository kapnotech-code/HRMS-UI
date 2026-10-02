import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';
import { appShellRoutes } from './layout/app-shell.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./ features/Landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./ features/Landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./ features/Landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./ features/Landing/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  {
    path: 'onboarding-checklist',
    loadComponent: () =>
      import('./ features/Landing/onboarding-checklist/onboarding-checklist.component').then(m => m.OnboardingChecklistComponent)
  },
  {
    path: 'employee-profiles',
    loadComponent: () =>
      import('./features/Recruiter/employee-profile/employee-profile.component').then(m => m.EmployeeProfileComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./ features/Login/Login').then(m => m.Login)
  },
  {
    path: 'c/:slug/login',
    loadComponent: () => import('./ features/Login/Login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./ features/REgister/Register').then(m => m.Register)
  },
  {
    path: 'company-register',
    loadComponent: () => import('./ features/REgister/Register').then(m => m.Register)
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./ features/Auth/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./ features/Auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./ features/Auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'set-password',
    loadComponent: () =>
      import('./ features/Auth/set-password.component').then(m => m.SetPasswordComponent)
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./ features/Subscriptions/SubscriptionPlans/subscription-plans.component').then(m => m.SubscriptionPlansComponent)
  },
  {
    path: 'subscriptions/plans',
    loadComponent: () =>
      import('./ features/Subscriptions/SubscriptionPlans/subscription-plans.component').then(m => m.SubscriptionPlansComponent)
  },
  {
    path: 'review/public/:id',
    loadComponent: () =>
      import('./ features/Reviews/ReviewDetails/review-details.component').then(m => m.ReviewDetailsComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-layout.component').then(m => m.AppLayoutComponent),
    canActivate: [authGuard],
    children: appShellRoutes
  }
];
