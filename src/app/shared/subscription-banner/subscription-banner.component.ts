import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SubscriptionEntitlementService, TenantEntitlement } from '../../core/services/subscription-entitlement.service';

@Component({
  selector: 'app-subscription-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sub-banner" *ngIf="banner" [class.sub-banner-warn]="banner.tone === 'warn'" [class.sub-banner-danger]="banner.tone === 'danger'">
      <div class="sub-banner-text">{{ banner.message }}</div>
      <a *ngIf="banner.cta" class="sub-banner-cta" [routerLink]="banner.ctaRoute">{{ banner.cta }}</a>
    </div>
  `,
  styles: [`
    .sub-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 1rem;
      margin: 0 0 1rem 0;
      border-radius: 8px;
      background: #e0f2fe;
      border: 1px solid #7dd3fc;
      color: #0c4a6e;
      font-size: 0.92rem;
    }
    .sub-banner-warn {
      background: #fef3c7;
      border-color: #fcd34d;
      color: #92400e;
    }
    .sub-banner-danger {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #991b1b;
    }
    .sub-banner-cta {
      flex-shrink: 0;
      font-weight: 700;
      text-decoration: none;
      color: inherit;
    }
  `]
})
export class SubscriptionBannerComponent implements OnInit, OnDestroy {
  banner: { message: string; cta: string; ctaRoute: string; tone: 'info' | 'warn' | 'danger' } | null = null;
  private destroy$ = new Subject<void>();

  constructor(private entitlement: SubscriptionEntitlementService) {}

  ngOnInit(): void {
    this.entitlement.entitlement$.pipe(takeUntil(this.destroy$)).subscribe(e => {
      this.banner = this.build(e);
    });
    this.entitlement.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private build(e: TenantEntitlement | null) {
    if (!e) return null;
    if ((e.status || '').toLowerCase() === 'pending') {
      return {
        message: 'Complete payment to activate your plan. You can view records, but other changes stay locked until then.',
        cta: 'Complete payment',
        ctaRoute: '/subscriptions/plans',
        tone: 'danger' as const
      };
    }
    if (e.isReadOnly) {
      return {
        message: 'Your subscription is not active. You can view records and manage billing, but other changes are locked.',
        cta: 'Renew',
        ctaRoute: '/subscriptions/plans',
        tone: 'danger' as const
      };
    }
    if (e.accessMode === 'Grace') {
      return {
        message: 'Your plan is in a grace period. Renew now to keep full access.',
        cta: 'Renew',
        ctaRoute: '/subscriptions/plans',
        tone: 'warn' as const
      };
    }
    if (e.isTrial && (e.daysRemaining ?? 99) <= 7) {
      return {
        message: `Trial: ${e.daysRemaining ?? 0} day(s) left` +
          (e.employeeLimit ? ` · ${e.employeeCount}/${e.employeeLimit} employees` : ''),
        cta: 'Upgrade',
        ctaRoute: '/subscriptions/plans',
        tone: 'info' as const
      };
    }
    if (e.employeeLimit && e.employeeCount >= e.employeeLimit) {
      return {
        message: `Employee limit reached (${e.employeeCount}/${e.employeeLimit}). Upgrade to add more people.`,
        cta: 'Upgrade',
        ctaRoute: '/subscriptions/plans',
        tone: 'warn' as const
      };
    }
    return null;
  }
}
