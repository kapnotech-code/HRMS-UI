import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './Auth.service';
import { SubscriptionPlanService } from './subscription-plan.service';
import { environment } from '../../../environments/environment';
import { MySubscription, ReviewEntitlement } from '../../shared/models/subscription/subscription-plan.model';

export interface TenantEntitlement {
  status: string;
  accessMode: 'Full' | 'Grace' | 'ReadOnly' | string;
  planCode?: string;
  planName?: string;
  daysRemaining?: number;
  isTrial: boolean;
  isReadOnly: boolean;
  employeeLimit?: number | null;
  employeeCount: number;
  features: string[];
  legacyUnrestricted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionEntitlementService {

  private subscriptionSubject = new BehaviorSubject<MySubscription | null>(null);
  private entitlementSubject = new BehaviorSubject<TenantEntitlement | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadedSubject = new BehaviorSubject<boolean>(false);

  subscription$: Observable<MySubscription | null> = this.subscriptionSubject.asObservable();
  entitlement$ = this.entitlementSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  loaded$ = this.loadedSubject.asObservable();

  constructor(
    private auth: AuthService,
    private subService: SubscriptionPlanService,
    private http: HttpClient
  ) {}

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  load(force = false): Observable<TenantEntitlement | null> {
    if (this.loadedSubject.value && !force) {
      return this.entitlement$;
    }
    if (!this.auth.isLoggedIn()) {
      this.loadedSubject.next(true);
      this.entitlementSubject.next(null);
      return of(null);
    }

    this.loadingSubject.next(true);
    return this.http.get<any>(`${environment.apiUrl}/SubscriptionPlan/entitlement`).pipe(
      map(res => this.normalizeEntitlement(res?.data ?? res?.Data ?? res)),
      tap(ent => {
        this.entitlementSubject.next(ent);
        this.loadedSubject.next(true);
        this.loadingSubject.next(false);
      }),
      catchError(() => {
        this.loadedSubject.next(true);
        this.loadingSubject.next(false);
        return of(null);
      })
    );
  }

  loadSubscription(force = false): Observable<MySubscription | null> {
    this.load(force).subscribe();
    if (this.loadedSubject.value && !force) {
      return this.subscription$;
    }

    if (!this.auth.isLoggedIn()) {
      this.subscriptionSubject.next(null);
      return of(null);
    }

    return this.subService.getMySubscription().pipe(
      map(sub => {
        this.subscriptionSubject.next(sub);
        return sub;
      })
    );
  }

  current(): TenantEntitlement | null {
    return this.entitlementSubject.value;
  }

  hasFeature(code: string): boolean {
    const e = this.entitlementSubject.value;
    if (!e) return true;
    if (e.legacyUnrestricted) return true;
    return e.features.map(f => f.toLowerCase()).includes(code.toLowerCase());
  }

  hasActiveSubscription(): boolean {
    const e = this.entitlementSubject.value;
    if (e) return !e.isReadOnly;
    const sub = this.subscriptionSubject.value;
    if (!sub) return false;
    return (sub.status === 'Active' || sub.status === 'Trial') && !sub.isExpired;
  }

  hasReviewFeature(): boolean {
    if (this.hasFeature('reports') || this.hasFeature('payroll') || this.current()?.legacyUnrestricted) {
      return true;
    }
    const sub = this.subscriptionSubject.value;
    if (!sub || !sub.features?.length) return false;
    return sub.features.some(f =>
      f.isIncluded && /review/i.test(f.featureName || '')
    );
  }

  canAccessReview(): boolean {
    return this.hasActiveSubscription() && this.hasReviewFeature();
  }

  getReviewEntitlement(): ReviewEntitlement {
    const sub = this.subscriptionSubject.value;
    const hasActive = this.hasActiveSubscription();
    const hasReviewFeature = this.hasReviewFeature();
    const canAccess = hasActive && hasReviewFeature;

    let subscriptionMessage = 'Subscribe to access cross-company review data and HR reviews.';
    let ctaText = 'View Subscription Plans';
    let ctaRoute = '/plans';

    if (this.current()?.isReadOnly || sub?.isExpired) {
      subscriptionMessage = 'Your subscription has expired. Please renew to access all review features including other companies\' reviews and HR reviews.';
      ctaText = 'Renew Subscription';
      ctaRoute = '/subscriptions/my-subscription';
    } else if (hasActive && !hasReviewFeature) {
      subscriptionMessage = 'Your current plan does not include review access. Upgrade your subscription to view reviews.';
      ctaText = 'Upgrade Plan';
      ctaRoute = '/subscriptions/plans';
    } else if (hasActive && hasReviewFeature) {
      subscriptionMessage = '';
      ctaText = '';
      ctaRoute = '';
    }

    return {
      hasActiveSubscription: hasActive,
      canAccessReview: canAccess,
      requiresSubscription: !canAccess,
      subscriptionMessage,
      ctaText,
      ctaRoute,
      subscription: sub
    };
  }

  reviewAccess$: Observable<ReviewEntitlement> = this.subscription$.pipe(
    map(() => this.getReviewEntitlement())
  );

  refresh(): Observable<MySubscription | null> {
    this.loadedSubject.next(false);
    this.subscriptionSubject.next(null);
    this.entitlementSubject.next(null);
    this.load(true).subscribe();
    return this.loadSubscription(true);
  }

  clearCache(): void {
    this.loadedSubject.next(false);
    this.loadingSubject.next(false);
    this.subscriptionSubject.next(null);
    this.entitlementSubject.next(null);
  }

  private normalizeEntitlement(raw: any): TenantEntitlement | null {
    if (!raw) return null;
    const features = (raw.features ?? raw.Features ?? []) as string[];
    return {
      status: raw.status ?? raw.Status ?? 'None',
      accessMode: raw.accessMode ?? raw.AccessMode ?? 'ReadOnly',
      planCode: raw.planCode ?? raw.PlanCode,
      planName: raw.planName ?? raw.PlanName,
      daysRemaining: raw.daysRemaining ?? raw.DaysRemaining,
      isTrial: !!(raw.isTrial ?? raw.IsTrial),
      isReadOnly: !!(raw.isReadOnly ?? raw.IsReadOnly),
      employeeLimit: raw.employeeLimit ?? raw.EmployeeLimit,
      employeeCount: Number(raw.employeeCount ?? raw.EmployeeCount ?? 0),
      features,
      legacyUnrestricted: !!(raw.legacyUnrestricted ?? raw.LegacyUnrestricted)
    };
  }
}
