import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService, RevenueSummary } from '../../core/services/billing.service';
import { UiAlertComponent, UiCardComponent, UiPageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [CommonModule, UiPageHeaderComponent, UiCardComponent, UiAlertComponent],
  template: `
    <ui-page-header title="Platform revenue" subtitle="Paid subscription collections across tenants." />
    <p *ngIf="loading">Loading…</p>
    <ui-alert *ngIf="error" tone="danger">{{ error }}</ui-alert>
    <div class="stat-grid" *ngIf="data && !loading">
      <ui-card><div class="k">Paid total</div><div class="v">₹{{ data.paidTotal | number:'1.2-2' }}</div></ui-card>
      <ui-card><div class="k">Paid orders</div><div class="v">{{ data.paidCount }}</div></ui-card>
      <ui-card><div class="k">Last 30 days</div><div class="v">₹{{ data.paidLast30Days | number:'1.2-2' }}</div></ui-card>
      <ui-card><div class="k">Est. MRR</div><div class="v">₹{{ data.estimatedMrr | number:'1.2-2' }}</div></ui-card>
    </div>
    <ui-card *ngIf="data">
      <h2>By plan</h2>
      <table class="rev-table">
        <thead><tr><th>Plan</th><th>Code</th><th>Orders</th><th>Paid</th></tr></thead>
        <tbody>
          <tr *ngFor="let row of data.byPlan">
            <td>{{ row.planName }}</td>
            <td>{{ row.planCode || '—' }}</td>
            <td>{{ row.paidCount }}</td>
            <td>₹{{ row.paidAmount | number:'1.2-2' }}</td>
          </tr>
          <tr *ngIf="!data.byPlan.length"><td colspan="4">No paid orders yet.</td></tr>
        </tbody>
      </table>
      <p class="muted">Pending: ₹{{ data.pendingTotal | number:'1.2-2' }} ({{ data.pendingCount }} orders)</p>
    </ui-card>
  `,
  styles: [`
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .k { color: var(--color-muted); font-size: 12px; }
    .v { font-size: 22px; font-weight: 700; color: var(--color-text); }
    .rev-table { width: 100%; border-collapse: collapse; }
    .rev-table th, .rev-table td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--color-border); }
    .muted { color: var(--color-muted); margin-top: 12px; }
    @media (max-width: 800px) { .stat-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class AdminRevenueComponent implements OnInit {
  data: RevenueSummary | null = null;
  loading = true;
  error = '';

  constructor(private billing: BillingService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.billing.revenue().subscribe({
      next: (d: RevenueSummary) => {
        this.data = {
          ...d,
          byPlan: d?.byPlan ?? []
        };
        this.loading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err?.error?.message || 'Could not load revenue.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
