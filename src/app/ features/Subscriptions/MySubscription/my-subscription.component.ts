import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriptionPlanService } from '../../../core/services/subscription-plan.service';
import { BillingService, InvoiceListItem } from '../../../core/services/billing.service';
import { UiAlertComponent, UiButtonComponent } from '../../../shared/ui';

@Component({
  selector: 'app-my-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, UiAlertComponent, UiButtonComponent],
  templateUrl: './my-subscription.component.html',
  styleUrls: ['./my-subscription.component.css']
})
export class MySubscriptionComponent implements OnInit {
  subscription: any = null;
  loading = false;
  errorMsg: string | null = null;
  invoices: InvoiceListItem[] = [];

  constructor(
    private subService: SubscriptionPlanService,
    private billing: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadSubscription(); this.loadInvoices(); }

  loadInvoices(): void {
    this.billing.invoices().subscribe({
      next: rows => { this.invoices = rows; this.cdr.detectChanges(); },
      error: () => { this.invoices = []; }
    });
  }

  downloadInvoice(id: number): void {
    this.billing.downloadPdf(id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

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
