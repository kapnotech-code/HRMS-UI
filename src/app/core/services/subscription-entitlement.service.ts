import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './Auth.service';
import { SubscriptionPlanService } from './subscription-plan.service';
import { MySubscription, ReviewEntitlement } from '../../shared/models/subscription/subscription-plan.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionEntitlementService {

  private subscriptionSubject = new BehaviorSubject<MySubscription | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadedSubject = new BehaviorSubject<boolean>(false);

  subscription$: Observable<MySubscription | null> = this.subscriptionSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  loaded$ = this.loadedSubject.asObservable();

  constructor(
    private auth: AuthService,
    private subService: SubscriptionPlanService
  ) {}

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  loadSubscription(force = false): Observable<MySubscription | null> {
    if (this.loadedSubject.value && !force) {
      return this.subscription$;
    }

    if (!this.auth.isLoggedIn()) {
      this.loadedSubject.next(true);
      this.loadingSubject.next(false);
      this.subscriptionSubject.next(null);
      return of(null);
    }

    if (this.loadingSubject.value) {
      return this.subscription$;
    }

    this.loadingSubject.next(true);
    return this.subService.getMySubscription().pipe(
      map(sub => {
        this.loadedSubject.next(true);
        this.loadingSubject.next(false);
        this.subscriptionSubject.next(sub);
        return sub;
      })
    );
  }

  hasActiveSubscription(): boolean {
    const sub = this.subscriptionSubject.value;
    if (!sub) return false;
    return sub.status === 'Active' && !sub.isExpired;
  }

  hasReviewFeature(): boolean {
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

    if (sub?.isExpired) {
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
    return this.loadSubscription(true);
  }

  clearCache(): void {
    this.loadedSubject.next(false);
    this.loadingSubject.next(false);
    this.subscriptionSubject.next(null);
  }
}
