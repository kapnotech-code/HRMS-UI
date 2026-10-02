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
    return this.http.get<{ success: boolean; data: RevenueSummary }>(`${this.admin}/revenue`).pipe(
      map(res => res.data)
    );
  }
}
