import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import {
  SubscriptionPlan,
  SubscriptionPlanFeature,
  SubscriptionPlanResponse,
  PlanFeatureResponse,
  SubscriptionFeatureResponse,
  MySubscription,
  MySubscriptionFeature,
  MySubscriptionResponse,
  MySubscriptionFeatureResponse,
  SubscriptionCheckout,
  SubscriptionActivationRequest,
  SubscriptionActivationResponse,
  CheckoutResponse,
  ActivateSubscriptionResponse,
  SubscriptionForType,
  PlanFilterType,
  SubscriptionStatus,
  PaymentStatus,
  RazorpayOrderRequest,
  RazorpayOrderResponse,
  RazorpayVerifyRequest,
  RazorpayVerifyResponse
} from '../../shared/models/subscription/subscription-plan.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPlanService {

  private apiUrl = `${environment.apiUrl}/SubscriptionPlan`;

  // Razorpay order creation/verification live on PaymentController,
  // not SubscriptionPlanController. Using apiUrl for these was hitting
  // a route that doesn't exist there (405 Method Not Allowed).
  private paymentApiUrl = `${environment.apiUrl}/Payment`;

  constructor(private http: HttpClient) { }

  // Backend route is the bare "api/SubscriptionPlan" — there is
  // no "/GetAll" segment on this controller. Calling "/GetAll"
  // was matching GetById(int id) instead, which failed int model
  // binding on the string "GetAll" and produced the 400.
  getAllPlans(): Observable<SubscriptionPlan[]> {
    return this.http
      .get<ApiResponse<SubscriptionPlanResponse[]>>(`${this.apiUrl}`)
      .pipe(
        map(response => {
          const plans = Array.isArray(response?.data) ? response.data : [];
          return plans.map(plan => this.normalizePlan(plan));
        }),
        catchError(() => of([]))
      );
  }

  getMySubscription(): Observable<MySubscription | null> {
    // The backend SubscriptionPlan controller has GET routes at the base URL
    // (GetAll) and at /{id} (GetById int). A single-segment path like
    // "GetMySubscription" falls through to {id}, fails int model binding,
    // and returns 400. Try multiple URL formats that the backend may support.
    const candidateUrls = [
      `${this.apiUrl}/GetMySubscriptions`,
      `${environment.apiUrl}/Subscription/GetMySubscription`,
      `${this.apiUrl}/GetMySubscription`,
    ];
    return this.tryGetMySubscription(candidateUrls, 0);
  }

  private tryGetMySubscription(urls: string[], index: number): Observable<MySubscription | null> {
    if (index >= urls.length) {
      return of(null);
    }
    return this.http
      .get<ApiResponse<MySubscriptionResponse>>(urls[index])
      .pipe(
        map(response => {
          if (!response?.data) return null;
          return this.normalizeMySubscription(response.data);
        }),
        catchError(error => {
          if ((error?.status === 400 || error?.status === 404) && index < urls.length - 1) {
            return this.tryGetMySubscription(urls, index + 1);
          }
          return of(null);
        })
      );
  }

  getCheckoutDetails(planId: number): Observable<SubscriptionCheckout | null> {
    return this.http
      .get<ApiResponse<CheckoutResponse>>(`${this.apiUrl}/GetCheckoutDetails/${planId}`)
      .pipe(
        map(response => {
          if (!response?.data) return null;
          return this.normalizeCheckout(response.data);
        }),
        catchError(() => of(null))
      );
  }

  activateSubscription(request: SubscriptionActivationRequest): Observable<SubscriptionActivationResponse> {
    return this.http
      .post<ApiResponse<ActivateSubscriptionResponse>>(`${this.apiUrl}/ActivateSubscription`, request)
      .pipe(
        map(response => {
          const data = response?.data;
          if (!data) {
            return { success: false, message: 'Invalid response from server' };
          }
          return {
            success: this.toBoolean(data.sa_Success),
            message: data.sa_Message ?? '',
            subscriptionId: data.sa_SubscriptionId,
            subscription: data.sa_Subscription ? this.normalizeMySubscription(data.sa_Subscription) : undefined,
            paymentUrl: data.sa_PaymentUrl,
            paymentStatus: this.normalizePaymentStatus(data.sa_PaymentStatus)
          };
        }),
        catchError(error => of({
          success: false,
          message: error?.error?.message || error?.message || 'Failed to activate subscription'
        }))
      );
  }

  private normalizePlan(plan: SubscriptionPlanResponse): SubscriptionPlan {
    const includedFeatures = this.extractIncludedFeatures(plan.planFeatures);
    return {
      planId: this.pick(plan, 'sP_Id', 'sP_PlanId', 'sp_PlanId', 'planId', 'PlanId'),
      planName: this.pick(plan, 'sP_PlanName', 'sp_PlanName', 'planName', 'PlanName') ?? '',
      planCode: this.pick(plan, 'sP_PlanCode', 'sp_PlanCode', 'planCode', 'PlanCode') ?? '',
      subscriptionFor: this.normalizeSubscriptionFor(this.pick(plan, 'sP_SubscriptionFor', 'sp_SubscriptionFor', 'subscriptionFor', 'SubscriptionFor')),
      price: Number(this.pick(plan, 'sP_Price', 'sp_Price', 'price', 'Price') ?? 0),
      durationDays: Number(this.pick(plan, 'sP_DurationDays', 'sp_DurationDays', 'durationDays', 'DurationDays') ?? 0),
      description: this.pick(plan, 'sP_Description', 'sp_Description', 'description', 'Description') ?? '',
      isActive: this.toBoolean(this.pick(plan, 'sP_IsActive', 'sp_IsActive', 'isActive', 'IsActive')),
      features: includedFeatures
    };
  }

  private normalizeCheckout(data: CheckoutResponse): SubscriptionCheckout {
    return {
      planId: this.pick(data, 'sC_PlanId', 'sc_PlanId', 'planId', 'PlanId'),
      planName: this.pick(data, 'sC_PlanName', 'sc_PlanName', 'planName', 'PlanName') ?? '',
      planCode: this.pick(data, 'sC_PlanCode', 'sc_PlanCode', 'planCode', 'PlanCode') ?? '',
      subscriptionFor: this.normalizeSubscriptionFor(this.pick(data, 'sC_SubscriptionFor', 'sc_SubscriptionFor', 'subscriptionFor', 'SubscriptionFor')),
      price: Number(this.pick(data, 'sC_Price', 'sc_Price', 'price', 'Price') ?? 0),
      durationDays: Number(this.pick(data, 'sC_DurationDays', 'sc_DurationDays', 'durationDays', 'DurationDays') ?? 0),
      description: this.pick(data, 'sC_Description', 'sc_Description', 'description', 'Description') ?? '',
      features: this.extractIncludedFeatures(data.planFeatures),
      employeeId: this.pick(data, 'sC_EmployeeId', 'sc_EmployeeId', 'employeeId', 'EmployeeId'),
      companyId: this.pick(data, 'sC_CompanyId', 'sc_CompanyId', 'companyId', 'CompanyId'),
      paymentRequired: this.toBoolean(this.pick(data, 'sC_PaymentRequired', 'sc_PaymentRequired', 'paymentRequired', 'PaymentRequired')),
      paymentUrl: this.pick(data, 'sC_PaymentUrl', 'sc_PaymentUrl', 'paymentUrl', 'PaymentUrl'),
      paymentStatus: this.normalizePaymentStatus(this.pick(data, 'sC_PaymentStatus', 'sc_PaymentStatus', 'paymentStatus', 'PaymentStatus'))
    };
  }

  private normalizeMySubscription(data: MySubscriptionResponse): MySubscription {
    const features = this.normalizeMySubscriptionFeatures(data.subscriptionFeatures);
    const status = this.normalizeStatus(this.pick(data, 'mS_Status', 'ms_Status', 'status', 'Status'));
    const endDate = this.pick(data, 'mS_EndDate', 'ms_EndDate', 'endDate', 'EndDate') ?? '';
    const startDate = this.pick(data, 'mS_StartDate', 'ms_StartDate', 'startDate', 'StartDate') ?? '';
    const daysRemaining = this.pick(data, 'mS_DaysRemaining', 'ms_DaysRemaining', 'daysRemaining', 'DaysRemaining');

    return {
      subscriptionId: this.pick(data, 'mS_SubscriptionId', 'ms_SubscriptionId', 'subscriptionId', 'SubscriptionId'),
      subscriptionFor: this.normalizeSubscriptionFor(this.pick(data, 'mS_SubscriptionFor', 'ms_SubscriptionFor', 'subscriptionFor', 'SubscriptionFor')),
      employeeId: this.pick(data, 'mS_EmployeeId', 'ms_EmployeeId', 'employeeId', 'EmployeeId'),
      companyId: this.pick(data, 'mS_CompanyId', 'ms_CompanyId', 'companyId', 'CompanyId'),
      planId: this.pick(data, 'mS_PlanId', 'ms_PlanId', 'planId', 'PlanId'),
      planName: this.pick(data, 'mS_PlanName', 'ms_PlanName', 'planName', 'PlanName') ?? '',
      planCode: this.pick(data, 'mS_PlanCode', 'ms_PlanCode', 'planCode', 'PlanCode') ?? '',
      price: Number(this.pick(data, 'mS_Price', 'ms_Price', 'price', 'Price') ?? 0),
      startDate,
      endDate,
      status,
      autoRenew: this.toBoolean(this.pick(data, 'mS_AutoRenew', 'ms_AutoRenew', 'autoRenew', 'AutoRenew')),
      features,
      daysRemaining: daysRemaining !== undefined ? Number(daysRemaining) : undefined,
      isExpired: status === 'Expired' || (daysRemaining !== undefined && Number(daysRemaining) <= 0)
    };
  }

  private normalizeMySubscriptionFeatures(features: MySubscriptionFeatureResponse[]): MySubscriptionFeature[] {
    if (!Array.isArray(features)) return [];

    return features
      .filter(f => this.toBoolean(this.pick(f, 'mSF_IsIncluded', 'msf_IsIncluded', 'isIncluded', 'IsIncluded')))
      .map(f => ({
        featureId: this.pick(f, 'mSF_FeatureId', 'msf_FeatureId', 'featureId', 'FeatureId') ?? 0,
        featureName: this.pick(f, 'mSF_FeatureName', 'msf_FeatureName', 'featureName', 'FeatureName') ?? '',
        featureDescription: this.pick(f, 'mSF_FeatureDescription', 'msf_FeatureDescription', 'featureDescription', 'FeatureDescription') ?? '',
        limitValue: this.pick(f, 'mSF_LimitValue', 'msf_LimitValue', 'limitValue', 'LimitValue') !== undefined
          ? Number(this.pick(f, 'mSF_LimitValue', 'msf_LimitValue', 'limitValue', 'LimitValue'))
          : undefined,
        limitType: this.pick(f, 'mSF_LimitType', 'msf_LimitType', 'limitType', 'LimitType'),
        isIncluded: true
      }));
  }

  private extractIncludedFeatures(planFeatures: PlanFeatureResponse[]): SubscriptionPlanFeature[] {
    if (!Array.isArray(planFeatures)) return [];

    return planFeatures
      .filter(pf => this.toBoolean(this.pick(pf, 'pF_IsIncluded', 'pf_IsIncluded', 'isIncluded', 'IsIncluded')))
      .map(pf => this.normalizeFeature(pf));
  }

  private normalizeFeature(planFeature: PlanFeatureResponse): SubscriptionPlanFeature {
    const feature = planFeature.subscriptionFeature || {};
    return {
      featureId: this.pick(feature, 'sF_FeatureId', 'sf_FeatureId', 'featureId', 'FeatureId') ?? 0,
      featureName: this.pick(feature, 'sF_FeatureName', 'sf_FeatureName', 'featureName', 'FeatureName') ?? '',
      featureDescription: this.pick(feature, 'sF_FeatureDescription', 'sf_FeatureDescription', 'featureDescription', 'FeatureDescription') ?? '',
      limitValue: this.pick(feature, 'sF_LimitValue', 'sf_LimitValue', 'limitValue', 'LimitValue') !== undefined
        ? Number(this.pick(feature, 'sF_LimitValue', 'sf_LimitValue', 'limitValue', 'LimitValue'))
        : undefined,
      limitType: this.pick(feature, 'sF_LimitType', 'sf_LimitType', 'limitType', 'LimitType'),
      isIncluded: true
    };
  }

  private normalizeSubscriptionFor(value: any): SubscriptionForType {
    if (!value) return 'Employee';
    const str = String(value).toLowerCase();
    if (str === 'company') return 'Company';
    return 'Employee';
  }

  private normalizeStatus(value: any): SubscriptionStatus {
    if (!value) return 'None';
    const str = String(value).toLowerCase();
    switch (str) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      case 'suspended': return 'Suspended';
      default: return 'None';
    }
  }

  private normalizePaymentStatus(value: any): PaymentStatus | undefined {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    switch (str) {
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'refunded': return 'Refunded';
      case 'notrequired': return 'NotRequired';
      default: return undefined;
    }
  }

  private toBoolean(value: any): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const str = String(value).toLowerCase();
    return str === 'true' || str === '1' || str === 'yes';
  }

  private pick(obj: any, ...keys: string[]): any {
    if (!obj) return undefined;
    // Also try lowercase and underscore variations
    const allKeys = [...keys];
    for (const key of keys) {
      allKeys.push(key.toLowerCase());
      allKeys.push(key.toUpperCase());
      // snake_case variations
      allKeys.push(key.replace(/([A-Z])/g, '_$1').toLowerCase());
      allKeys.push(key.replace(/([A-Z])/g, '_$1').toUpperCase());
    }
    for (const key of allKeys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        return obj[key];
      }
    }
    return undefined;
  }

  filterPlansByType(plans: SubscriptionPlan[], filter: PlanFilterType): SubscriptionPlan[] {
    if (filter === 'All') return plans;
    return plans.filter(plan => plan.subscriptionFor === filter);
  }

  getPlanById(plans: SubscriptionPlan[], planId: number): SubscriptionPlan | undefined {
    return plans.find(p => p.planId === planId);
  }

  // ==========================================
  // RAZORPAY INTEGRATION
  //
  // Correct backend routes:
  //   POST api/Payment/CreateOrder
  //   POST api/Payment/Verify
  //
  // The backend's response envelope is single-level:
  //   { success, statusCode, data: { ...actual fields... }, message }
  // NOT double-nested — reading response.data.data (as before) always
  // returned undefined even when the request succeeded.
  //
  // The backend serializes the inner data fields as snake_case
  // (order_id, key_id, company_id, etc. — confirmed from a live
  // response). pick() already auto-generates a snake_case variant
  // from each camelCase key it's given, so passing the camelCase
  // names here is enough to match both naming styles.
  // ==========================================

  createRazorpayOrder(request: RazorpayOrderRequest): Observable<RazorpayOrderResponse> {
    return this.http
      .post<ApiResponse<any>>(`${this.paymentApiUrl}/CreateOrder`, request)
      .pipe(
        map(response => this.normalizeRazorpayOrder(response)),
        catchError(error => {
          const msg = error?.error?.message || error?.message || 'Failed to create Razorpay order';
          return of({
            success: false,
            orderId: '',
            keyId: '',
            amount: 0,
            currency: 'INR',
            name: '',
            description: '',
            planId: 0,
            planName: '',
            companyId: 0,
            employeeId: 0,
            message: msg
          } as RazorpayOrderResponse);
        })
      );
  }

  private normalizeRazorpayOrder(response: ApiResponse<any>): RazorpayOrderResponse {
    const data = response?.data;

    if (!response?.success || !data) {
      return {
        success: false,
        orderId: '',
        keyId: '',
        amount: 0,
        currency: 'INR',
        name: '',
        description: '',
        planId: 0,
        planName: '',
        companyId: 0,
        employeeId: 0,
        message: response?.message || 'Failed to create Razorpay order'
      } as RazorpayOrderResponse;
    }

    return {
      success: this.toBoolean(this.pick(data, 'success', 'Success')),
      orderId: this.pick(data, 'orderId', 'OrderId') ?? '',
      keyId: this.pick(data, 'keyId', 'KeyId') ?? '',
      amount: Number(this.pick(data, 'amount', 'Amount') ?? 0),
      currency: this.pick(data, 'currency', 'Currency') ?? 'INR',
      name: this.pick(data, 'name', 'Name') ?? '',
      description: this.pick(data, 'description', 'Description') ?? '',
      planId: Number(this.pick(data, 'planId', 'PlanId') ?? 0),
      planName: this.pick(data, 'planName', 'PlanName') ?? '',
      companyId: this.pick(data, 'companyId', 'CompanyId'),
      employeeId: this.pick(data, 'employeeId', 'EmployeeId'),
      message: this.pick(data, 'message', 'Message') ?? response?.message
    } as RazorpayOrderResponse;
  }

  verifyRazorpayPayment(request: RazorpayVerifyRequest): Observable<RazorpayVerifyResponse> {
    return this.http
      .post<ApiResponse<any>>(`${this.paymentApiUrl}/Verify`, request)
      .pipe(
        map(response => this.normalizeRazorpayVerify(response)),
        catchError(error => {
          const msg = error?.error?.message || error?.message || 'Failed to verify payment';
          return of({ success: false, message: msg, paymentId: 0, subscriptionId: 0, paymentStatus: 'Failed' } as RazorpayVerifyResponse);
        })
      );
  }

  private normalizeRazorpayVerify(response: ApiResponse<any>): RazorpayVerifyResponse {
    const data = response?.data;

    if (!response?.success || !data) {
      return {
        success: false,
        message: response?.message || 'Failed to verify payment',
        paymentId: 0,
        subscriptionId: 0,
        paymentStatus: 'Failed'
      } as RazorpayVerifyResponse;
    }

    return {
      success: this.toBoolean(this.pick(data, 'success', 'Success')),
      message: this.pick(data, 'message', 'Message') ?? response?.message ?? '',
      paymentId: Number(this.pick(data, 'paymentId', 'PaymentId') ?? 0),
      subscriptionId: this.pick(data, 'subscriptionId', 'SubscriptionId'),
      paymentStatus: this.normalizePaymentStatus(this.pick(data, 'paymentStatus', 'PaymentStatus')) ?? 'Failed'
    } as RazorpayVerifyResponse;
  }
}
