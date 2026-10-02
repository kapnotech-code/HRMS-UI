import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SubscriptionPlanService } from '../../../core/services/subscription-plan.service';
import { BillingService, PriceQuote } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/Auth.service';
import { SubscriptionPlan, RazorpayOrderRequest, RazorpayOrderResponse } from '../../../shared/models/subscription/subscription-plan.model';
import { UiAlertComponent, UiButtonComponent } from '../../../shared/ui';

declare global {
  interface Window {
    Razorpay: any;
  }
}

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiAlertComponent, UiButtonComponent],
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.css']
})
export class SubscriptionPlansComponent implements OnInit {

  plans: SubscriptionPlan[] = [];
  filteredPlans: SubscriptionPlan[] = [];
  loading = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;
  activePlanId: number | null = null;
  selectedPlan: SubscriptionPlan | null = null;
  showCheckout = false;
  razorpayReady = false;
  isLoggedIn = false;
  billingCycle: 'monthly' | 'yearly' = 'monthly';
  couponCode = '';
  quote: PriceQuote | null = null;

  constructor(
    private subService: SubscriptionPlanService,
    private billing: BillingService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.loadPlans();
    this.loadRazorpayScript();
  }

  loadPlans(): void {
    this.loading = true;
    this.errorMsg = null;
    this.subService.getAllPlans().subscribe({
      next: (plans) => {
        this.plans = plans || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to load subscription plans.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    this.filteredPlans = [...this.plans];
  }

  selectPlan(plan: SubscriptionPlan): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/subscriptions/plans' }
      });
      return;
    }

    this.selectedPlan = plan;
    this.showCheckout = true;
    this.errorMsg = null;
    this.successMsg = null;
    this.couponCode = '';
    this.quote = null;
    this.refreshQuote();
  }

  closeCheckout(): void {
    this.showCheckout = false;
    this.selectedPlan = null;
  }

  async payWithRazorpay(): Promise<void> {
    if (!this.selectedPlan) return;

    this.errorMsg = null;
    this.successMsg = null;

    if (!this.razorpayReady) {
      const loaded = await this.loadRazorpayScript();
      if (!loaded) {
        this.errorMsg = 'Failed to load Razorpay checkout. Please check your internet connection and try again.';
        return;
      }
    }

    this.loading = true;
    const companyId = this.auth.getCompanyId();
    const employeeId = this.auth.getEmployeeId();

    const orderRequest: RazorpayOrderRequest = {
      planId: this.selectedPlan.planId,
      companyId: companyId != null ? companyId : undefined,
      employeeId: employeeId != null ? employeeId : undefined,
      billingInterval: this.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
      couponCode: this.couponCode?.trim() || undefined
    };

    this.subService.createRazorpayOrder(orderRequest).subscribe({
      next: (res: RazorpayOrderResponse) => {
        this.loading = false;

        if (!res?.success || !res.orderId || !res.keyId) {
          this.errorMsg = res?.message || 'Failed to create Razorpay order. Please try again.';
          return;
        }

        const options = {
          key: res.keyId,
          amount: res.amount,
          currency: res.currency || 'INR',
          name: res.name || 'HRMS Subscription',
          description: res.description || `${this.selectedPlan!.planName} subscription`,
          order_id: res.orderId,
          handler: (response: any) => {
            this.verifyAndActivate(response, res);
          },
          prefill: {
            name: this.auth.getCurrentUser()?.userName || '',
            email: this.auth.getCurrentUser()?.email || '',
            contact: ''
          },
          theme: { color: '#1e3c72' },
          modal: {
            ondismiss: () => {
              this.errorMsg = 'Payment was cancelled. Your subscription was not activated.';
              this.cdr.detectChanges();
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || err?.message || 'Failed to create order. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  private verifyAndActivate(
    razorpayResponse: any,
    orderData: RazorpayOrderResponse
  ): void {
    this.loading = true;
    this.successMsg = null;
    this.errorMsg = null;

    const companyId = orderData.companyId || 0;
    const employeeId = orderData.employeeId || 0;

    this.subService.verifyRazorpayPayment({
      razorpayPaymentId: razorpayResponse.razorpay_payment_id,
      razorpayOrderId: razorpayResponse.razorpay_order_id,
      razorpaySignature: razorpayResponse.razorpay_signature,
      planId: orderData.planId || this.selectedPlan!.planId,
      planName: orderData.planName || this.selectedPlan!.planName,
      companyId,
      employeeId,
      amount: (orderData.amount || 0) / 100,
      currency: orderData.currency || 'INR'
    } as any).subscribe({
      next: (res: any) => {
        this.loading = false;
        const success = res?.success ?? res?.data?.success;

        if (success) {
          this.successMsg = 'Payment successful! Your subscription has been activated. 🎉';
          this.activePlanId = orderData.planId || this.selectedPlan!.planId;
          this.closeCheckout();
          setTimeout(() => {
            this.router.navigate(['/subscriptions/my-subscription']);
          }, 2000);
        } else {
          this.errorMsg = res?.message || res?.data?.message || 'Payment verification failed. Please contact support.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || err?.message || 'Payment verification failed. Please contact support.';
        this.cdr.detectChanges();
      }
    });
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.razorpayReady) {
        resolve(true);
        return;
      }
      const scriptId = 'razorpay-checkout';
      const existing = document.getElementById(scriptId);
      if (existing) {
        this.razorpayReady = true;
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.razorpayReady = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  refreshQuote(): void {
    if (!this.selectedPlan) {
      return;
    }
    this.billing.quote(
      this.selectedPlan.planId,
      this.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
      this.couponCode
    ).subscribe(q => {
      this.quote = q;
      if (!q.success) {
        this.errorMsg = q.message || 'Coupon could not be applied.';
      } else {
        this.errorMsg = null;
      }
    });
  }

  retry(): void {
    this.loadPlans();
  }

  getPlanDisplayPrice(plan: SubscriptionPlan): number {
    if (this.billingCycle === 'yearly') {
      return this.getYearlyPrice(plan);
    }
    return (plan.monthlyPrice && plan.monthlyPrice > 0) ? plan.monthlyPrice : plan.price;
  }

  getPlanIcon(planCode: string): string {
    const code = (planCode || '').toUpperCase();
    if (code.includes('STARTER') || code.includes('FREE') || code.includes('BASIC') || code.includes('TRIAL')) return '🌱';
    if (code.includes('GROWTH') || code.includes('PRO') || code.includes('BUSINESS')) return '🚀';
    if (code.includes('ENTERPRISE') || code.includes('PREMIUM')) return '🏢';
    return '💳';
  }

  getYearlyPrice(plan: SubscriptionPlan): number {
    if (plan.yearlyPrice && plan.yearlyPrice > 0) {
      return plan.yearlyPrice;
    }
    const monthly = (plan.monthlyPrice && plan.monthlyPrice > 0) ? plan.monthlyPrice : plan.price;
    return Math.round(monthly * 12 * 0.8 * 100) / 100;
  }
}
