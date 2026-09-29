import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReviewService, } from '../../../core/services/review.service';
import { SubscriptionEntitlementService } from '../../../core/services/subscription-entitlement.service';
import { SubscriptionRequiredComponent } from '../../../shared/subscription-required/subscription-required.component';
import { ReviewHistory } from '../../../shared/models/review/review.model';

@Component({
  selector: 'app-review-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SubscriptionRequiredComponent],
  templateUrl: './review-history.component.html',
  styleUrls: ['./review-history.component.css']
})
export class ReviewHistoryComponent implements OnInit {

  history: ReviewHistory[] = [];
  filteredHistory: ReviewHistory[] = [];
  loading = false;
  errorMsg: string | null = null;
  searchTerm = '';

  constructor(
    private reviewService: ReviewService,
    private entitlementService: SubscriptionEntitlementService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.entitlementService.loadSubscription();
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.errorMsg = null;

    this.reviewService.getHistory().subscribe({
      next: (history) => {
        this.history = history || [];
        this.filteredHistory = [...this.history];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to load review history.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredHistory = [...this.history];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredHistory = this.history.filter(h =>
      (h.reviewId?.toString().includes(term) || false) ||
      h.year?.toString().includes(term) ||
      h.reviewType?.toLowerCase().includes(term) ||
      h.reviewer?.toLowerCase().includes(term) ||
      h.reviewee?.toLowerCase().includes(term) ||
      h.status?.toLowerCase().includes(term)
    );
  }

  retry(): void {
    this.loadHistory();
  }
}
