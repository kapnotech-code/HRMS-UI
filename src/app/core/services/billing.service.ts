import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PriceQuote {
  success: boolean;
  message?: string;
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstTotal: number;
  payable: number;
  payablePaisa: number;
  split: string;
  couponCode?: string;
  planName?: string;
}

export interface InvoiceListItem {
  invoiceId: number;
  number: string;
  amount: number;
  status: string;
  issuedAt?: string;
  paidAt?: string;
  couponCode?: string;
  hasPdf: boolean;
}

export interface RevenueSummary {
  paidTotal: number;
  paidCount: number;
  pendingTotal: number;
  pendingCount: number;
  paidLast30Days: number;
  estimatedMrr: number;
  byPlan: { planName: string; planCode?: string; paidAmount: number; paidCount: number }[];
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private api = `${environment.apiUrl}/billing`;
  private admin = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  quote(planId: number, billingInterval: string, couponCode?: string): Observable<PriceQuote> {
    return this.http.post<{ success: boolean; message?: string; data: PriceQuote }>(`${this.api}/quote`, {
      planId,
      billingInterval,
      couponCode: couponCode || null
    }).pipe(
      map(res => {
        const d = res?.data;
        if (!res?.success || !d) {
          return { success: false, message: res?.message || 'Could not price this plan.', subtotal: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, gstTotal: 0, payable: 0, payablePaisa: 0, split: '' };
        }
        return { ...d, success: true, message: res.message };
      }),
      catchError(err => of({
        success: false,
        message: err?.error?.message || 'Could not price this plan.',
        subtotal: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, gstTotal: 0, payable: 0, payablePaisa: 0, split: ''
      }))
    );
  }

  invoices(): Observable<InvoiceListItem[]> {
    return this.http.get<{ success: boolean; data: InvoiceListItem[] }>(`${this.api}/invoices`).pipe(
      map(res => res?.data ?? [])
    );
  }

  downloadPdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.api}/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
  }

  revenue(): Observable<RevenueSummary> {
    const empty: RevenueSummary = {
      paidTotal: 0,
      paidCount: 0,
      pendingTotal: 0,
      pendingCount: 0,
      paidLast30Days: 0,
      estimatedMrr: 0,
      byPlan: []
    };
    return this.http.get<any>(`${this.admin}/revenue`).pipe(
      map(res => {
        const d = res?.data ?? res?.Data;
        if (!d) {
          return empty;
        }
        const byPlan = (d.byPlan ?? d.ByPlan ?? []).map((row: Record<string, unknown>) => ({
          planName: String(row['planName'] ?? row['PlanName'] ?? '(unknown)'),
          planCode: (row['planCode'] ?? row['PlanCode']) as string | undefined,
          paidAmount: Number(row['paidAmount'] ?? row['PaidAmount'] ?? 0),
          paidCount: Number(row['paidCount'] ?? row['PaidCount'] ?? 0)
        }));
        return {
          paidTotal: Number(d.paidTotal ?? d.PaidTotal ?? 0),
          paidCount: Number(d.paidCount ?? d.PaidCount ?? 0),
          pendingTotal: Number(d.pendingTotal ?? d.PendingTotal ?? 0),
          pendingCount: Number(d.pendingCount ?? d.PendingCount ?? 0),
          paidLast30Days: Number(d.paidLast30Days ?? d.PaidLast30Days ?? 0),
          estimatedMrr: Number(d.estimatedMrr ?? d.EstimatedMrr ?? 0),
          byPlan
        };
      })
    );
  }
}
