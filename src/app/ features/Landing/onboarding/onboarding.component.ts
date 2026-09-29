import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Step {
  number: number;
  label: string;
  description: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent {
  currentStep = 1;
  totalSteps = 4;

  steps: Step[] = [
    { number: 1, label: 'Company Info', description: 'Tell us about your organization' },
    { number: 2, label: 'Admin User', description: 'Set up your admin account' },
    { number: 3, label: 'Employee Setup', description: 'Configure employee and payroll settings' },
    { number: 4, label: 'Review', description: 'Confirm and complete setup' }
  ];

  formData = {
    companyName: '',
    companyEmail: '',
    industry: '',
    companySize: '',
    country: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    confirmPassword: '',
    employeeCount: '',
    payrollFrequency: 'monthly',
    currency: 'USD'
  };

  checklist = [
    { id: 'company', label: 'Complete company information', done: false },
    { id: 'admin', label: 'Set up admin user account', done: false },
    { id: 'employees', label: 'Configure employee setup', done: false },
    { id: 'review', label: 'Review and complete setup', done: false }
  ];

  get checklistProgress(): number {
    const done = this.checklist.filter(c => c.done).length;
    return Math.round((done / this.checklist.length) * 100);
  }

  toggleChecklistItem(id: string): void {
    const item = this.checklist.find(c => c.id === id);
    if (item) {
      item.done = !item.done;
    }
  }

  industries = [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing',
    'Retail', 'Education', 'Construction', 'Hospitality',
    'Professional Services', 'Non-Profit', 'Other'
  ];

  countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'India', 'Singapore', 'Japan', 'Other'
  ];

  constructor(private router: Router) {}

  get progress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  nextStep(): void {
    if (this.validateStep(this.currentStep)) {
      this.markChecklistItemDone(this.currentStep);
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      } else {
        this.completeSetup();
      }
    }
  }

  private markChecklistItemDone(step: number): void {
    const stepToChecklistId: Record<number, string> = {
      1: 'company',
      2: 'admin',
      3: 'employees',
      4: 'review'
    };
    const id = stepToChecklistId[step];
    if (id) {
      const item = this.checklist.find(c => c.id === id);
      if (item) {
        item.done = true;
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/home']);
    }
  }

  validateStep(step: number): boolean {
    if (step === 1) {
      return !!(this.formData.companyName && this.formData.companyEmail && this.formData.industry && this.formData.companySize && this.formData.country);
    }
    if (step === 2) {
      const valid = !!(this.formData.adminFirstName && this.formData.adminLastName && this.formData.adminEmail);
      const passValid = this.formData.adminPassword.length >= 6 &&
        this.formData.adminPassword === this.formData.confirmPassword;
      return valid && passValid;
    }
    if (step === 3) {
      return !!this.formData.employeeCount;
    }
    return true;
  }

  getStepError(step: number): string {
    if (step === 1) {
      if (!this.formData.companyName) return 'Company name is required.';
      if (!this.formData.companyEmail) return 'Company email is required.';
      if (!this.formData.industry) return 'Please select an industry.';
      if (!this.formData.companySize) return 'Please select a company size.';
      if (!this.formData.country) return 'Please select a country.';
    }
    if (step === 2) {
      if (!this.formData.adminFirstName) return 'First name is required.';
      if (!this.formData.adminLastName) return 'Last name is required.';
      if (!this.formData.adminEmail) return 'Email is required.';
      if (this.formData.adminPassword.length < 6 && this.formData.adminPassword) return 'Password must be at least 6 characters.';
      if (this.formData.adminPassword && this.formData.adminPassword !== this.formData.confirmPassword) return 'Passwords do not match.';
    }
    if (step === 3) {
      if (!this.formData.employeeCount) return 'Please select the number of employees.';
    }
    return '';
  }

  isStepValid(step: number): boolean {
    return this.validateStep(step);
  }

  completeSetup(): void {
    alert(`Congratulations! ${this.formData.companyName} has been set up successfully.\nYou can now log in with ${this.formData.adminEmail}.`);
    this.router.navigate(['/login']);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
