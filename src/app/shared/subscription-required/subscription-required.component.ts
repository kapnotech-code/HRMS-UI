import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriptionEntitlementService } from '../../core/services/subscription-entitlement.service';
import { ReviewEntitlement } from '../../shared/models/subscription/subscription-plan.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-subscription-required',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sub-req-container" *ngIf="entitlement && entitlement.requiresSubscription">
      <div class="sub-req-banner">
        <div class="sub-req-icon">🔒</div>
        <div class="sub-req-body">
          <h4 class="sub-req-title">Subscription Required</h4>
          <p class="sub-req-message">{{ entitlement.subscriptionMessage }}</p>
          <div class="sub-req-actions">
            <a [routerLink]="entitlement.ctaRoute" class="btn btn-primary btn-sm">
              {{ entitlement.ctaText }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sub-req-container {
      margin-bottom: 1.5rem;
    }
    .sub-req-banner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
      border: 1px solid #93c5fd;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }
    .sub-req-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
    }
    .sub-req-body {
      flex: 1;
    }
    .sub-req-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e3c72;
    }
    .sub-req-message {
      margin: 0 0 0.75rem 0;
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .sub-req-actions .btn {
      padding: 0.5rem 1.2rem;
      border-radius: 6px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #1e3c72 0%, #2563eb 100%);
      color: white;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #1a365d 0%, #1d4ed8 100%);
      transform: translateY(-1px);
    }
  `]
})
export class SubscriptionRequiredComponent implements OnInit, OnDestroy {

  entitlement: ReviewEntitlement | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private entitlementService: SubscriptionEntitlementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.entitlementService.loaded$.pipe(takeUntil(this.destroy$)).subscribe(loaded => {
      if (loaded) {
        this.entitlement = this.entitlementService.getReviewEntitlement();
        this.cdr.detectChanges();
      }
    });

    this.entitlementService.loadSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
