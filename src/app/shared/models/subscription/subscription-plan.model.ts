export interface SubscriptionPlan {
  planId: number;
  planName: string;
  planCode: string;
  subscriptionFor: 'Employee' | 'Company';
  price: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  durationDays: number;
  description: string;
  isActive: boolean;
  isTrial?: boolean;
  maxEmployees?: number | null;
  features: SubscriptionPlanFeature[];
}

export interface SubscriptionPlanFeature {
  featureId: number;
  featureName: string;
  featureDescription: string;
  limitValue?: number;
  limitType?: string;
  isIncluded: boolean;
}

export interface MySubscription {
  subscriptionId: number;
  subscriptionFor: 'Employee' | 'Company';
  employeeId?: number;
  companyId?: number;
  planId: number;
  planName: string;
  planCode: string;
  price: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  features: MySubscriptionFeature[];
  daysRemaining?: number;
  isExpired?: boolean;
}

export interface MySubscriptionFeature {
  featureId: number;
  featureName: string;
  featureDescription: string;
  limitValue?: number;
  limitType?: string;
  isIncluded: boolean;
  featureCode?: string;
}

export type SubscriptionStatus = 'Active' | 'Trial' | 'Pending' | 'Expired' | 'Cancelled' | 'Suspended' | 'None';

export interface SubscriptionCheckout {
  planId: number;
  planName: string;
  planCode: string;
  subscriptionFor: 'Employee' | 'Company';
  price: number;
  durationDays: number;
  description: string;
  features: SubscriptionPlanFeature[];
  employeeId?: number;
  companyId?: number;
  paymentRequired: boolean;
  paymentUrl?: string;
  paymentStatus?: PaymentStatus;
}

export interface SubscriptionActivationRequest {
  planId: number;
  subscriptionFor: 'Employee' | 'Company';
  employeeId?: number;
  companyId?: number;
  paymentReferenceId?: string;
  autoRenew?: boolean;
}

export interface SubscriptionActivationResponse {
  success: boolean;
  message: string;
  subscriptionId?: number;
  subscription?: MySubscription;
  paymentUrl?: string;
  paymentStatus?: PaymentStatus;
}

export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded' | 'NotRequired';

export interface SubscriptionPlanResponse {
  sP_Id: number;
  sP_PlanName: string;
  sP_PlanCode: string;
  sP_SubscriptionFor: string;
  sP_Price: number;
  sP_DurationDays: number;
  sP_Description: string;
  sP_IsActive: boolean;
  planFeatures: PlanFeatureResponse[];
}

export interface PlanFeatureResponse {
  pf_PlanFeatureId: number;
  pf_PlanId: number;
  pf_FeatureId: number;
  pf_IsIncluded: boolean;
  subscriptionFeature: SubscriptionFeatureResponse;
}

export interface SubscriptionFeatureResponse {
  sf_FeatureId: number;
  sf_FeatureName: string;
  sf_FeatureDescription: string;
  sf_LimitValue?: number;
  sf_LimitType?: string;
}

export interface MySubscriptionResponse {
  ms_SubscriptionId: number;
  ms_SubscriptionFor: string;
  ms_EmployeeId?: number;
  ms_CompanyId?: number;
  ms_PlanId: number;
  ms_PlanName: string;
  ms_PlanCode: string;
  ms_Price: number;
  ms_StartDate: string;
  ms_EndDate: string;
  ms_Status: string;
  ms_AutoRenew: boolean;
  ms_DaysRemaining?: number;
  subscriptionFeatures: MySubscriptionFeatureResponse[];
}

export interface MySubscriptionFeatureResponse {
  msf_FeatureId: number;
  msf_FeatureName: string;
  msf_FeatureDescription: string;
  msf_LimitValue?: number;
  msf_LimitType?: string;
  msf_IsIncluded: boolean;
}

export interface CheckoutResponse {
  sP_PlanId: number;
  sP_PlanName: string;
  sP_PlanCode: string;
  sP_SubscriptionFor: string;
  sP_Price: number;
  sP_DurationDays: number;
  sP_Description: string;
  sP_PaymentRequired: boolean;
  sP_PaymentUrl?: string;
  sP_PaymentStatus?: string;
  sP_EmployeeId?: number;
  sP_CompanyId?: number;
  planFeatures: PlanFeatureResponse[];
}

export interface ActivateSubscriptionResponse {
  sa_Success: boolean;
  sa_Message: string;
  sa_SubscriptionId?: number;
  sa_Subscription?: MySubscriptionResponse;
  sa_PaymentUrl?: string;
  sa_PaymentStatus?: string;
}

export interface ActivateSubscriptionResponse {
  sa_Success: boolean;
  sa_Message: string;
  sa_SubscriptionId?: number;
  sa_Subscription?: MySubscriptionResponse;
  sa_PaymentUrl?: string;
  sa_PaymentStatus?: string;
}

export type SubscriptionForType = 'Employee' | 'Company';
export type PlanFilterType = 'All' | 'Employee' | 'Company';

export interface ReviewEntitlement {
  hasActiveSubscription: boolean;
  canAccessReview: boolean;
  requiresSubscription: boolean;
  subscriptionMessage: string;
  ctaText: string;
  ctaRoute: string;
  subscription: MySubscription | null;
}

// Razorpay types
export interface RazorpayOrderRequest {
  planId: number;
  employeeId?: number;
  companyId?: number;
  billingInterval?: 'MONTHLY' | 'YEARLY' | string;
  couponCode?: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  keyId: string;
  amount: number;        // in paisa
  currency: string;
  name: string;
  description: string;
  planId: number;
  planName: string;
  companyId: number;
  employeeId: number;
  message?: string;
}

export interface RazorpayOrderApiResponse {
  success: boolean;
  statusCode: number;
  data: RazorpayOrderResponse;
  message: string;
}

export interface RazorpayVerifyRequest {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  planId: number;
  planName: string;
  companyId: number;
  employeeId: number;
  amount: number;
  currency: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  message: string;
  paymentId: number;
  subscriptionId: number;
  paymentStatus: string;
}

export interface RazorpayVerifyApiResponse {
  success: boolean;
  statusCode: number;
  data: RazorpayVerifyResponse;
  message: string;
}