import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';
import { SubscriptionEntitlementService } from '../../../core/services/subscription-entitlement.service';
import { SubscriptionRequiredComponent } from '../../../shared/subscription-required/subscription-required.component';
import { ReviewDetail, ReviewSaveRequest } from '../../../shared/models/review/review.model';

@Component({
  selector: 'app-review-details',
  standalone: true,
  imports: [CommonModule, FormsModule, SubscriptionRequiredComponent],
  templateUrl: './review-details.component.html',
  styleUrls: ['./review-details.component.css']
})
export class ReviewDetailsComponent implements OnInit {

  review: ReviewDetail | null = null;
  loading = false;
  saving = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;
  reviewId: number | null = null;
  isReadOnly = false;
  isFromHistory = false;
  isPublicMode = false;

  // Form fields for editing
  formData: ReviewSaveRequest = {
    id: 0,
    rating: 0,
    comments: '',
    strengths: '',
    improvements: '',
    visibility: 'Internal'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    private entitlementService: SubscriptionEntitlementService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Check if public mode (no auth required route)
    this.isPublicMode = this.router.url.startsWith('/review/public/');
    
    if (!this.isPublicMode) {
      this.entitlementService.loadSubscription();
    }
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.reviewId = Number(id);
        // Check if coming from history (read-only)
        this.isFromHistory = this.router.url.includes('/history');
        this.isReadOnly = this.isFromHistory;
        this.loadReviewDetails();
      } else {
        this.errorMsg = 'Invalid review ID.';
      }
    });
  }

  loadReviewDetails(): void {
    if (!this.reviewId) return;

    this.loading = true;
    this.errorMsg = null;

    this.reviewService.getById(this.reviewId).subscribe({
      next: (review) => {
        this.review = review;
        this.populateFormData();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to load review details.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  populateFormData(): void {
    if (!this.review) return;
    this.formData = {
      id: this.review.id,
      rating: this.review.rating ?? 0,
      comments: this.review.comments ?? '',
      strengths: this.review.strengths ?? '',
      improvements: this.review.improvements ?? '',
      visibility: this.review.visibility ?? 'Internal'
    };
  }

  goBack(): void {
    this.router.navigate([this.isFromHistory ? '/transactions/review/history' : '/transactions/review/pending']);
  }

  closeWindow(): void {
    window.close();
  }

  retry(): void {
    this.loadReviewDetails();
  }

  saveDraft(): void {
    if (!this.reviewId) return;
    this.saving = true;
    this.errorMsg = null;
    this.successMsg = null;

    this.reviewService.save(this.formData).subscribe({
      next: () => {
        this.successMsg = 'Draft saved successfully.';
        this.saving = false;
        this.loadReviewDetails();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to save draft.';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitReview(): void {
    if (!this.reviewId) return;
    if (!this.formData.rating || this.formData.rating < 1) {
      this.errorMsg = 'Rating is required to submit.';
      return;
    }
    this.saving = true;
    this.errorMsg = null;
    this.successMsg = null;

    this.reviewService.submit(this.formData).subscribe({
      next: () => {
        this.successMsg = 'Review submitted successfully.';
        this.saving = false;
        this.isReadOnly = true;
        this.loadReviewDetails();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to submit review.';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  canEdit(): boolean {
    if (this.isPublicMode) {
      // In public mode, allow editing if review is pending
      return this.review?.status?.toLowerCase() === 'pending';
    }
    return !this.isReadOnly && this.review?.status?.toLowerCase() === 'pending';
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase().trim();
    if (s === 'pending' || s === 'p') return 'badge-pending';
    if (s === 'in progress' || s === 'inprogress' || s === 'in-progress' || s === 'in_progress') return 'badge-inprogress';
    if (s === 'completed' || s === 'complete' || s === 'submitted' || s === 'done' || s === 'approved' || s === 'closed') return 'badge-completed';
    return 'badge-default';
  }

  getStatusLabel(status: string): string {
    const s = (status || '').toLowerCase().trim();
    if (s === 'pending' || s === 'p') return 'Pending';
    if (s === 'in progress' || s === 'inprogress' || s === 'in-progress' || s === 'in_progress') return 'In Progress';
    if (s === 'completed' || s === 'complete' || s === 'submitted' || s === 'done' || s === 'approved' || s === 'closed') return 'Completed';
    return status || 'Pending';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  getStarRating(rating: number | null | undefined): string {
    if (!rating) return '☆☆☆☆☆';
    const r = Number(rating);
    const fullStars = Math.floor(r);
    const hasHalf = r % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalf) stars += '½';
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    stars += '☆'.repeat(emptyStars);
    return stars;
  }
}
