import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';
import { SubscriptionPlanService } from '../../core/services/subscription-plan.service';
import { SubscriptionPlan } from '../../shared/models/subscription/subscription-plan.model';

interface Step { number: number; label: string; icon: string; }

interface RegisterPlanCard {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  desc: string;
  employees: string;
  features: string[];
  badge: string;
  color: string;
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './Register.html',
    styleUrls: ['./Register.css']
})
export class Register implements OnInit {
  currentStep = 1;
  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  paymentRequired = false;
  plansLoading = false;

  steps: Step[] = [
    { number: 1, label: 'Company Info', icon: '🏢' },
    { number: 2, label: 'Admin Account', icon: '👤' },
    { number: 3, label: 'Choose Plan', icon: '💳' },
    { number: 4, label: 'Complete', icon: '🎉' }
  ];

  form = {
    companyName: '',
    companyEmail: '',
    industry: '',
    companySize: '',
    country: '',
    phone: '',
    website: '',
    fullName: '',
    loginName: '',
    email: '',
    password: '',
    confirmPassword: '',
    selectedPlan: 'TRIAL'
  };

  plans: RegisterPlanCard[] = [];

  industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Construction', 'Hospitality', 'Professional Services', 'Non-Profit', 'Other'];
  countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'Japan', 'Other'];
  companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'];

  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
  private readonly loginNameRegex = /^[a-zA-Z0-9._-]{3,100}$/;

  constructor(
    private authService: AuthService,
    private planService: SubscriptionPlanService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.plansLoading = true;
    this.planService.getAllPlans().subscribe({
      next: (rows) => {
        const companyPlans = (rows || []).filter(p =>
          p.isActive && (p.subscriptionFor === 'Company' || !p.subscriptionFor)
        );
        this.plans = companyPlans.map(p => this.toCard(p));
        if (this.plans.length && !this.plans.some(p => p.id === this.form.selectedPlan)) {
          const trial = this.plans.find(p => p.price <= 0) || this.plans[0];
          this.form.selectedPlan = trial.id;
        }
        this.plansLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.plansLoading = false;
        this.errorMessage = 'Could not load plans. Refresh and try again.';
        this.cdr.detectChanges();
      }
    });
  }

  private toCard(p: SubscriptionPlan): RegisterPlanCard {
    const monthly = p.monthlyPrice && p.monthlyPrice > 0 ? p.monthlyPrice : p.price;
    const isFree = p.isTrial || monthly <= 0;
    return {
      id: (p.planCode || 'TRIAL').toUpperCase(),
      name: p.planName,
      price: isFree ? 0 : monthly,
      priceLabel: isFree ? 'Trial' : `₹${monthly}`,
      desc: p.description || '',
      employees: p.maxEmployees ? `Up to ${p.maxEmployees} employees` : 'Employee limit per plan',
      features: (p.features || []).filter(f => f.isIncluded).map(f => f.featureName).slice(0, 8),
      badge: (p.planCode || '').toUpperCase() === 'PROFESSIONAL' ? 'Most Popular' : '',
      color: '#0f766e'
    };
  }

  get progress(): number { return ((this.currentStep - 1) / (this.steps.length - 1)) * 100; }

  get selectedPlanObj() { return this.plans.find(p => p.id === this.form.selectedPlan) || this.plans[0]; }

  get passwordStrength(): { score: number; label: string; color: string } {
    const p = this.form.password;
    if (!p) return { score: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z\d]/.test(p)) score++;
    if (score <= 2) return { score, label: 'Weak', color: '#dc2626' };
    if (score <= 4) return { score, label: 'Fair', color: '#d97706' };
    if (score === 5) return { score, label: 'Good', color: '#2563eb' };
    return { score, label: 'Strong', color: '#059669' };
  }

  get passwordStrengthWidth(): number {
    return Math.round((this.passwordStrength.score / 6) * 100);
  }

  get passwordsMatch(): boolean {
    return this.form.confirmPassword.length > 0 &&
           this.form.password === this.form.confirmPassword;
  }

  get passwordsMismatch(): boolean {
    return this.form.confirmPassword.length > 0 &&
           this.form.password !== this.form.confirmPassword;
  }

  validateStep(): boolean {
    this.errorMessage = '';
    if (this.currentStep === 1) {
      if (!this.form.companyName.trim() || this.form.companyName.trim().length < 2)
        return this.fail('Company name must be at least 2 characters.');
      if (!this.emailRegex.test(this.form.companyEmail.trim()))
        return this.fail('Please enter a valid company email address.');
      if (!this.form.industry)
        return this.fail('Please select an industry.');
      if (!this.form.companySize)
        return this.fail('Please select company size.');
      if (!this.form.country)
        return this.fail('Please select a country.');
    }
    if (this.currentStep === 2) {
      if (!this.form.fullName.trim() || this.form.fullName.trim().length < 2)
        return this.fail('Full name must be at least 2 characters.');
      if (!this.loginNameRegex.test(this.form.loginName.trim()))
        return this.fail('Login ID must be 3-100 characters: letters, numbers, dots, hyphens or underscores only.');
      if (!this.emailRegex.test(this.form.email.trim()))
        return this.fail('Please enter a valid email address.');
      if (!this.passwordRegex.test(this.form.password))
        return this.fail('Password must be at least 8 characters with uppercase, lowercase, a number, and a special character.');
      if (this.form.password !== this.form.confirmPassword)
        return this.fail('Passwords do not match.');
    }
    return true;
  }

  private fail(msg: string): boolean {
    this.errorMessage = msg;
    return false;
  }

  next(): void {
    if (!this.validateStep()) return;
    if (this.currentStep < 4) this.currentStep++;
  }

  prev(): void {
    if (this.currentStep > 1) this.currentStep--;
    this.errorMessage = '';
  }

  submit(): void {
    this.errorMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    const request = {
      fullName: this.form.fullName.trim(),
      loginName: this.form.loginName.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      companyName: this.form.companyName.trim(),
      companyEmail: this.form.companyEmail.trim(),
      industry: this.form.industry,
      companySize: this.form.companySize,
      country: this.form.country,
      phone: this.form.phone?.trim() || undefined,
      website: this.form.website?.trim() || undefined,
      selectedPlan: this.form.selectedPlan
    };

    this.authService.register(request as any).subscribe({
      next: (res) => {
        this.loading = false;
        this.paymentRequired = !!(res?.data?.paymentRequired ?? res?.data?.PaymentRequired);
        this.currentStep = 4;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message || err?.error?.Message || 'Registration failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  goToDashboard(): void { this.router.navigate(['/login']); }
  goToPlans(): void { this.router.navigate(['/subscriptions/plans']); }
}
