import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/Auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent {
  currentStep = 1;
  totalSteps = 5;
  loading = false;
  errorMsg = '';
  completed = false;

  steps = [
    { number: 1, label: 'Company', icon: '🏢' },
    { number: 2, label: 'Admin', icon: '👤' },
    { number: 3, label: 'HR Setup', icon: '⚙️' },
    { number: 4, label: 'Plan', icon: '💳' },
    { number: 5, label: 'Review', icon: '✅' }
  ];

  form = {
    companyName: '', companyEmail: '', industry: '', companySize: '', country: '', phone: '',
    adminFirstName: '', adminLastName: '', adminEmail: '', adminPhone: '', adminPassword: '', confirmPassword: '',
    employeeCount: '', payrollFrequency: 'monthly', currency: 'INR', fiscalYearStart: 'April',
    selectedPlan: 'starter'
  };

  plans = [
    { id: 'starter', name: 'Starter', price: 'Free', desc: 'Up to 10 employees', color: '#64748b', features: ['Employee database', 'Attendance', 'Leave management'] },
    { id: 'growth', name: 'Growth', price: '$14/emp/mo', desc: 'Up to 150 employees', color: '#0f766e', features: ['Full payroll', 'Shift scheduling', '360° Reviews'], popular: true },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'Unlimited employees', color: '#1e3a5f', features: ['Custom permissions', 'Multi-branch', 'Dedicated CSM'] }
  ];

  industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Construction', 'Hospitality', 'Professional Services', 'Non-Profit', 'Other'];
  countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'Japan', 'Other'];

  constructor(private router: Router, private authService: AuthService) {}

  get progress(): number { return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100; }

  get selectedPlanObj() { return this.plans.find(p => p.id === this.form.selectedPlan) || this.plans[0]; }

  validate(): boolean {
    this.errorMsg = '';
    if (this.currentStep === 1) {
      if (!this.form.companyName.trim()) { this.errorMsg = 'Company name is required.'; return false; }
      if (!this.form.companyEmail.trim()) { this.errorMsg = 'Company email is required.'; return false; }
      if (!this.form.industry) { this.errorMsg = 'Please select an industry.'; return false; }
      if (!this.form.companySize) { this.errorMsg = 'Please select company size.'; return false; }
      if (!this.form.country) { this.errorMsg = 'Please select a country.'; return false; }
    }
    if (this.currentStep === 2) {
      if (!this.form.adminFirstName.trim()) { this.errorMsg = 'First name is required.'; return false; }
      if (!this.form.adminLastName.trim()) { this.errorMsg = 'Last name is required.'; return false; }
      if (!this.form.adminEmail.trim()) { this.errorMsg = 'Email is required.'; return false; }
      if (this.form.adminPassword.length < 6) { this.errorMsg = 'Password must be at least 6 characters.'; return false; }
      if (this.form.adminPassword !== this.form.confirmPassword) { this.errorMsg = 'Passwords do not match.'; return false; }
    }
    if (this.currentStep === 3) {
      if (!this.form.employeeCount) { this.errorMsg = 'Please select employee count.'; return false; }
    }
    return true;
  }

  next(): void {
    if (!this.validate()) return;
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  prev(): void {
    if (this.currentStep > 1) this.currentStep--;
    else this.router.navigate(['/']);
  }

  complete(): void {
    this.loading = true;
    this.errorMsg = '';
    setTimeout(() => {
      this.loading = false;
      this.completed = true;
    }, 1200);
  }

  goToLogin(): void { this.router.navigate(['/login']); }
  goToPlans(): void { this.router.navigate(['/subscriptions/plans']); }
}
