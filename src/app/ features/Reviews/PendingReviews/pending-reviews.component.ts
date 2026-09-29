import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';
import { SubscriptionEntitlementService } from '../../../core/services/subscription-entitlement.service';
import { SubscriptionRequiredComponent } from '../../../shared/subscription-required/subscription-required.component';
import { PendingReview } from '../../../shared/models/review/review.model';

@Component({
  selector: 'app-pending-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, SubscriptionRequiredComponent],
  templateUrl: './pending-reviews.component.html',
  styleUrls: ['./pending-reviews.component.css']
})
export class PendingReviewsComponent implements OnInit {

  pendingReviews: PendingReview[] = [];
  loading = false;
  errorMsg: string | null = null;

  constructor(
    private reviewService: ReviewService,
    private entitlementService: SubscriptionEntitlementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.entitlementService.loadSubscription();
    this.loadPendingReviews();
  }

  loadPendingReviews(): void {
    this.loading = true;
    this.errorMsg = null;

    this.reviewService.getPending().subscribe({
      next: (reviews) => {
        this.pendingReviews = reviews || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to load pending reviews.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isOverdue(dueDate: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  retry(): void {
    this.loadPendingReviews();
  }
}
