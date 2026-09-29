import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  done: boolean;
}

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-checklist.component.html',
  styleUrl: './onboarding-checklist.component.css'
})
export class OnboardingChecklistComponent {
  totalSteps = 4;
  currentStep = 1;

  steps = [
    { number: 1, label: 'Company Info', description: 'Tell us about your organization' },
    { number: 2, label: 'Admin User', description: 'Set up your admin account' },
    { number: 3, label: 'Employee Setup', description: 'Configure employee and payroll settings' },
    { number: 4, label: 'Review', description: 'Confirm and complete setup' }
  ];

  checklist: ChecklistItem[] = [
    {
      id: 'company',
      label: 'Company Information',
      description: 'Set up your organization name, email, industry, size and country.',
      icon: '🏢',
      done: false
    },
    {
      id: 'admin',
      label: 'Admin User Account',
      description: 'Create the admin account that will manage your HRMS workspace.',
      icon: '👤',
      done: false
    },
    {
      id: 'employee',
      label: 'Employee Setup',
      description: 'Configure employee count, payroll frequency and currency.',
      icon: '👥',
      done: false
    },
    {
      id: 'review',
      label: 'Review & Complete',
      description: 'Review all details and complete the onboarding setup.',
      icon: '✅',
      done: false
    }
  ];

  constructor(private router: Router) {}

  get progress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  get checklistProgress(): number {
    const done = this.checklist.filter(c => c.done).length;
    return Math.round((done / this.checklist.length) * 100);
  }

  toggleItem(id: string): void {
    const item = this.checklist.find(c => c.id === id);
    if (item) {
      item.done = !item.done;
    }
  }

  resetAll(): void {
    this.checklist.forEach(c => c.done = false);
  }

  completeAll(): void {
    this.checklist.forEach(c => c.done = true);
  }

  goBack(): void {
    this.router.navigate(['/onboarding']);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/home']);
    }
  }
}