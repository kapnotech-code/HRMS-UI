import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../app/core/services/Auth.service';

interface Step { number: number; label: string; icon: string; }

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Register.html',
  styleUrls: ['./Register.css']
})
export class Register {
  currentStep = 1;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  steps: Step[] = [
    { number: 1, label: 'Company Info', icon: '🏢' },
    { number: 2, label: 'Admin Account', icon: '👤' },
    { number: 3, label: 'Choose Plan', icon: '💳' },
    { number: 4, label: 'Complete', icon: '🎉' }
  ];

  form = {
    // Step 1
    companyName: '',
    companyEmail: '',
    industry: '',
    companySize: '',
    country: '',
    phone: '',
    website: '',
    // Step 2
    fullName: '',
    loginName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 3
    selectedPlan: 'starter'
  };

  plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      priceLabel: 'Free',
      desc: 'Perfect for small teams getting started',
      employees: 'Up to 10 employees',
      features: ['Core employee database', 'Attendance tracking', 'Leave management', 'Holiday calendar'],
      badge: '',
      color: '#64748b'
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 14,
      priceLabel: '$14',
      desc: 'Full HR suite for scaling companies',
      employees: 'Up to 150 employees',
      features: ['Everything in Starter', 'Automated payroll', 'Shift scheduling', '360° Reviews', 'Document vault', 'Priority support'],
      badge: 'Most Popular',
      color: '#0f766e'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: -1,
      priceLabel: 'Custom',
      desc: 'Tailored for large organizations',
      employees: 'Unlimited employees',
      features: ['Everything in Growth', 'Custom permissions', 'Multi-branch support', 'Dedicated CSM', 'Custom API access', '99.95% SLA'],
      badge: '',
      color: '#1e3a5f'
    }
  ];

  industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Construction', 'Hospitality', 'Professional Services', 'Non-Profit', 'Other'];
  countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'Japan', 'Other'];
  companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'];

  constructor(private authService: AuthService, private router: Router) {}

  get progress(): number { return ((this.currentStep - 1) / (this.steps.length - 1)) * 100; }

  get selectedPlanObj() { return this.plans.find(p => p.id === this.form.selectedPlan) || this.plans[0]; }

  validateStep(): boolean {
    this.errorMessage = '';
    if (this.currentStep === 1) {
      if (!this.form.companyName.trim()) { this.errorMessage = 'Company name is required.'; return false; }
      if (!this.form.companyEmail.trim()) { this.errorMessage = 'Company email is required.'; return false; }
      if (!this.form.industry) { this.errorMessage = 'Please select an industry.'; return false; }
      if (!this.form.companySize) { this.errorMessage = 'Please select company size.'; return false; }
      if (!this.form.country) { this.errorMessage = 'Please select a country.'; return false; }
    }
    if (this.currentStep === 2) {
      if (!this.form.fullName.trim()) { this.errorMessage = 'Full name is required.'; return false; }
      if (!this.form.loginName.trim()) { this.errorMessage = 'Login ID is required.'; return false; }
      if (!this.form.email.trim()) { this.errorMessage = 'Email is required.'; return false; }
      if (this.form.password.length < 6) { this.errorMessage = 'Password must be at least 6 characters.'; return false; }
      if (this.form.password !== this.form.confirmPassword) { this.errorMessage = 'Passwords do not match.'; return false; }
    }
    return true;
  }

  next(): void {
    if (!this.validateStep()) return;
    if (this.currentStep < 4) this.currentStep++;
  }

  prev(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  submit(): void {
    this.errorMessage = '';
    this.loading = true;

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
      selectedPlan: this.form.selectedPlan
    };

    this.authService.register(request as any).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.currentStep = 4;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message || err?.error?.Message || 'Registration failed. Please try again.';
      }
    });
  }

  goToDashboard(): void { this.router.navigate(['/login']); }
  goToPlans(): void { this.router.navigate(['/subscriptions/plans']); }
}
