import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriptionPlanService } from '../../../core/services/subscription-plan.service';

@Component({
  selector: 'app-my-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-subscription.component.html',
  styleUrls: ['./my-subscription.component.css']
})
export class MySubscriptionComponent implements OnInit {
  subscription: any = null;
  loading = false;
  errorMsg: string | null = null;

  constructor(private subService: SubscriptionPlanService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadSubscription(); }

  loadSubscription(): void {
    this.loading = true;
    this.errorMsg = null;
    this.subService.getMySubscription().subscribe({
      next: (sub) => { this.subscription = sub; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to load subscription.';
        this.subscription = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get daysRemainingPercent(): number {
    if (!this.subscription?.daysRemaining || !this.subscription?.durationDays) return 0;
    return Math.min(100, Math.round((this.subscription.daysRemaining / this.subscription.durationDays) * 100));
  }

  get statusClass(): string {
    if (!this.subscription) return '';
    if (this.subscription.isExpired) return 'status-expired';
    if (this.subscription.status === 'Active') return 'status-active';
    return 'status-pending';
  }
}
