import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ReviewService } from '../../../core/services/review.service';
import { SubscriptionEntitlementService } from '../../../core/services/subscription-entitlement.service';
import { SubscriptionRequiredComponent } from '../../../shared/subscription-required/subscription-required.component';
import { DashboardReview, PendingReview, ReviewHistory } from '../../../shared/models/review/review.model';

export type DashboardTab = 'all' | 'pending' | 'in-progress' | 'completed';

@Component({
  selector: 'app-review-dashboard',
  standalone: true,
  imports: [CommonModule, SubscriptionRequiredComponent],
  templateUrl: './review-dashboard.component.html',
  styleUrls: ['./review-dashboard.component.css']
})
export class ReviewDashboardComponent implements OnInit {

  allReviews: DashboardReview[] = [];
  loading = false;
  errorMsg: string | null = null;

  summary = {
    totalReviews: 0,
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0
  };

  activeTab: DashboardTab = 'all';

  constructor(
    private reviewService: ReviewService,
    private entitlementService: SubscriptionEntitlementService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.entitlementService.loadSubscription();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.errorMsg = null;

    // Fetch from multiple endpoints to get all review statuses
    forkJoin({
      pending: this.reviewService.getPending(),
      history: this.reviewService.getHistory()
    }).subscribe({
      next: ({ pending, history }) => {
        const combined: DashboardReview[] = [
          ...(pending || []).map(p => this.toDashboardReview(p)),
          ...(history || []).map(h => this.toDashboardReview(h))
        ];
        // Deduplicate by reviewId
        const seen = new Set<string | number>();
        this.allReviews = combined.filter(r => {
          const id = r.reviewId;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        this.calculateSummary();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to load review data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private toDashboardReview(item: PendingReview | ReviewHistory): DashboardReview {
    return {
      reviewId: item.reviewId,
      year: item.year,
      reviewType: item.reviewType,
      reviewer: item.reviewer,
      reviewee: item.reviewee,
      reviewerId: item.reviewerId,
      revieweeId: item.revieweeId,
      dueDate: (item as PendingReview).dueDate || '',
      status: item.status
    };
  }

  private calculateSummary(): void {
    this.summary.totalReviews = this.allReviews.length;
    this.summary.pendingCount = this.countByStatus('pending');
    this.summary.inProgressCount = this.countByStatus('in-progress');
    this.summary.completedCount = this.countByStatus('completed');
  }

  private countByStatus(status: string): number {
    return this.allReviews.filter(
      review => this.normalizeStatus(review.status) === status
    ).length;
  }

  get filteredReviews(): DashboardReview[] {
    switch (this.activeTab) {
      case 'pending':
        return this.allReviews.filter(r => this.normalizeStatus(r.status) === 'pending');
      case 'in-progress':
        return this.allReviews.filter(r => this.normalizeStatus(r.status) === 'in-progress');
      case 'completed':
        return this.allReviews.filter(r => this.normalizeStatus(r.status) === 'completed');
      default:
        return [...this.allReviews];
    }
  }

  private normalizeStatus(status: string): string {
    const s = (status || '').toLowerCase().trim();
    if (s === 'pending' || s === 'p') return 'pending';
    if (s === 'in progress' || s === 'inprogress' || s === 'in-progress' || s === 'in_progress') return 'in-progress';
    if (s === 'completed' || s === 'complete' || s === 'submitted' || s === 'done' || s === 'approved' || s === 'closed') return 'completed';
    return s;
  }

  setTab(tab: DashboardTab): void {
    this.activeTab = tab;
  }

  statusBadgeClass(status: string): string {
    const normalized = this.normalizeStatus(status);
    switch (normalized) {
      case 'pending': return 'badge-pending';
      case 'in-progress': return 'badge-inprogress';
      case 'completed': return 'badge-completed';
      default: return 'badge-default';
    }
  }

  statusLabel(status: string): string {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'in-progress') return 'In Progress';
    if (normalized === 'completed') return 'Completed';
    if (normalized === 'pending') return 'Pending';
    return status || 'Pending';
  }

  getTabCount(tab: DashboardTab): number {
    switch (tab) {
      case 'pending': return this.summary.pendingCount;
      case 'in-progress': return this.summary.inProgressCount;
      case 'completed': return this.summary.completedCount;
      default: return this.summary.totalReviews;
    }
  }

  viewReview(row: DashboardReview): void {
    const id = row.reviewId;
    if (id === undefined || id === null || id === '') return;
    this.router.navigate(['/transactions/review/details', id]);
  }

  completeReview(row: DashboardReview): void {
    const id = row.reviewId;
    if (id === undefined || id === null || id === '') return;
    this.router.navigate(['/transactions/review/details', id]);
  }

  retry(): void {
    this.loadDashboardData();
  }
}