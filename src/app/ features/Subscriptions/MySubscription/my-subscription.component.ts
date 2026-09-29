import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlanService } from '../../../core/services/subscription-plan.service';
import { SubscriptionPlan } from '../../../shared/models/subscription/subscription-plan.model';

@Component({
  selector: 'app-my-subscription',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="container py-4">
    <h2 class="mb-4">My Subscription</h2>

    <div *ngIf="loading" class="text-center py-5"><i class="pi pi-spinner pi-spin"></i> Loading...</div>

    <div *ngIf="!loading && !subscription && !errorMsg" class="text-center py-5 text-muted">
      <i class="pi pi-info-circle"></i> You do not have an active subscription.
    </div>

    <div *ngIf="errorMsg" class="alert alert-error mb-3">
      {{ errorMsg }}
      <button class="btn btn-link btn-sm" (click)="loadSubscription()">Retry</button>
    </div>

    <div *ngIf="!loading && subscription" class="card p-4">
      <div class="flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">{{ subscription.planName }}</h3>
        <span [ngClass]="{'status-active': subscription.status === 'Active', 'status-expired': subscription.isExpired, 'status-pending': subscription.status === 'Pending'}">
          {{ subscription.status }}
        </span>
      </div>

      <p class="text-muted">{{ subscription.description }}</p>

      <div class="grid">
        <div class="col-6 md:col-3 mb-3"><strong>Plan Code:</strong> {{ subscription.planCode }}</div>
        <div class="col-6 md:col-3 mb-3"><strong>Type:</strong> {{ subscription.subscriptionFor }}</div>
        <div class="col-6 md:col-3 mb-3"><strong>Price:</strong> \${{ subscription.price }}</div>
        <div class="col-6 md:col-3 mb-3"><strong>Auto Renew:</strong> {{ subscription.autoRenew ? 'Yes' : 'No' }}</div>
      </div>

      <div class="grid">
        <div class="col-6 md:col-3 mb-3"><strong>Start Date:</strong> {{ subscription.startDate | date }}</div>
        <div class="col-6 md:col-3 mb-3"><strong>End Date:</strong> {{ subscription.endDate | date }}</div>
        <div class="col-6 md:col-3 mb-3" *ngIf="subscription.daysRemaining !== undefined"><strong>Days Remaining:</strong> {{ subscription.daysRemaining }}</div>
        <div class="col-6 md:col-3 mb-3" *ngIf="subscription.daysRemaining === undefined"><strong>Days Remaining:</strong> -</div>
      </div>

      <div *ngIf="subscription.isExpired" class="alert alert-warning mt-3">
        Your subscription has expired. Please renew to continue using premium features.
      </div>

      <div class="mt-4">
        <h4>Included Features</h4>
        <ul class="list-group">
          <li class="list-group-item" *ngFor="let feature of subscription.features">
            {{ feature.featureName }}
            <span class="text-muted" *ngIf="feature.limitValue">({{ feature.limitValue }}{{ feature.limitType }})</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-4" *ngIf="allPlans.length > 0">
      <h4>Need a different plan? Browse <a routerLink="/subscriptions/plans">all subscription plans</a></h4>
    </div>
  </div>
  `,
  styles: [`
    .status-active { color: #28a745; font-weight: bold; }
    .status-expired { color: #dc3545; font-weight: bold; }
    .status-pending { color: #ffc107; font-weight: bold; }
    .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  `]
})
export class MySubscriptionComponent implements OnInit {

  subscription: any = null;
  allPlans: SubscriptionPlan[] = [];
  loading = false;
  errorMsg: string | null = null;

  constructor(
    private subService: SubscriptionPlanService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
  }

  loadSubscription(): void {
    this.loading = true;
    this.errorMsg = null;

    this.subService.getMySubscription().subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to load subscription.';
        this.subscription = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
