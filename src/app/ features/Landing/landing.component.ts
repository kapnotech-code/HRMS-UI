import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface MenuItem {
  icon: string;
  label: string;
  desc?: string;
  target: string;
  badge?: string;
}

interface MenuColumn {
  title: string;
  items: MenuItem[];
}

interface FeatureModule {
  id: string;
  icon: string;
  tag: string;
  title: string;
  description: string;
  benefits: string[];
  route?: string;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  monthlyPrice: number | string;
  yearlyPrice: number | string;
  popular?: boolean;
  ctaText: string;
  features: string[];
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
  open: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  // Navigation & Dropdown state
  menuOpen: string | null = null;
  mobileMenuOpen = false;
  isLoggedIn = false;
  userName: string = 'User';

  // Hero Right Column Mode: 'auth' (Google/Apple/Email card) or 'preview' (Live SaaS tabs)
  heroMode: 'auth' | 'preview' = 'auth';
  loginEmail: string = '';

  // Hero Preview Interactive State
  activePreviewTab: 'dashboard' | 'attendance' | 'payroll' | 'reviews' = 'dashboard';
  isPunchedIn: boolean = true;
  punchTime: string = '09:04 AM';
  selectedShift: string = 'General (09:30 - 18:00)';

  // Payroll Interactive simulator in Hero Preview
  baseSalary: number = 65000;
  hraAllowance: number = 18000;
  specialAllowance: number = 12000;
  pfDeduction: number = 4200;
  taxDeduction: number = 3800;

  // Interactive ROI Calculator State
  calculatorEmployees: number = 65;

  // Pricing State
  billingCycle: 'monthly' | 'yearly' = 'yearly';

  // Demo Modal State
  isDemoModalOpen = false;
  demoSubmitted = false;
  demoForm = {
    name: '',
    email: '',
    company: '',
    teamSize: '21-50',
    phone: '',
    notes: ''
  };

  // Toast notification
  toastMsg: string | null = null;
  private toastTimer: any;

  // Quick Newsletter / Contact form in footer
  newsletterEmail: string = '';
  newsletterSuccess: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    this.isLoggedIn = !!token;
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        this.userName = u.name || u.username || u.email?.split('@')[0] || 'User';
      } catch (e) {
        this.userName = 'User';
      }
    }
  }

  // Top Navbar Items
  navItems = [
    { key: 'products', label: 'Products', hasDropdown: true },
    { key: 'solutions', label: 'Solutions', hasDropdown: true },
    { key: 'features', label: 'Features', hasDropdown: false, target: 'features' },
    { key: 'calculator', label: 'ROI Calculator', hasDropdown: false, target: 'calculator' },
    { key: 'pricing', label: 'Pricing', hasDropdown: false, target: 'pricing' },
    { key: 'resources', label: 'Resources', hasDropdown: true }
  ];

  // Mega Menus Content
  menus: { [key: string]: MenuColumn[] } = {
    products: [
      {
        title: 'Workforce & Core HR',
        items: [
          { icon: '👥', label: 'Employee Management', desc: 'Centralized directory, roles & org hierarchy', target: 'features' },
          { icon: '🚀', label: 'Onboarding Wizard', desc: 'Interactive step-by-step new hire onboarding', target: 'onboarding', badge: 'Live' },
          { icon: '📋', label: 'Onboarding Checklist', desc: 'Interactive pre-boarding checklist tool', target: 'onboarding-checklist', badge: 'Interactive' },
          { icon: '📑', label: 'Document Vault', desc: 'Secure categorised records & ID compliance', target: 'features' }
        ]
      },
      {
        title: 'Time & Attendance',
        items: [
          { icon: '⏱️', label: 'Time Tracking', desc: 'Biometric & web punch with precise clock-in logs', target: 'features' },
          { icon: '🗓️', label: 'Shift Scheduling', desc: 'Multi-shift rosters and automated schedule emails', target: 'features' },
          { icon: '🌴', label: 'Leave & Absences', desc: 'Custom leave types, approvals & balance tracking', target: 'features' }
        ]
      },
      {
        title: 'Payroll & Compensation',
        items: [
          { icon: '💵', label: 'Automated Payroll', desc: 'One-click salary calculation with zero error', target: 'features' },
          { icon: '📊', label: 'Salary Components', desc: 'Allowances, deductions, revisions & structures', target: 'features' },
          { icon: '💳', label: 'Subscription Plans', desc: 'Manage your company tiers and entitlements', target: 'plans' }
        ]
      },
      {
        title: 'Performance & Growth',
        items: [
          { icon: '🎯', label: '360° Reviews', desc: 'Structured appraisals, ratings & peer feedback', target: 'features' },
          { icon: '📈', label: 'Review Dashboard', desc: 'Track pending reviews, histories & employee KPI', target: 'features' }
        ]
      }
    ],
    solutions: [
      {
        title: 'By Company Size',
        items: [
          { icon: '🌱', label: 'Startups (1 - 25)', desc: 'Get running in 10 mins with zero HR overhead', target: 'solutions' },
          { icon: '🌿', label: 'Growing Teams (25 - 150)', desc: 'Scale automated payroll, shifts & performance', target: 'solutions' },
          { icon: '🏢', label: 'Enterprise (150+)', desc: 'Granular permissions, multi-branch & custom rules', target: 'solutions' }
        ]
      },
      {
        title: 'By Role',
        items: [
          { icon: '👩‍💼', label: 'For HR Leaders', desc: 'Cut paperwork, eliminate manual payroll calculations', target: 'solutions' },
          { icon: '🧑‍💻', label: 'For Department Managers', desc: 'Approve leaves, monitor shifts, evaluate reviews', target: 'solutions' },
          { icon: '📱', label: 'For Employees', desc: 'Self-service portal, view payslips & apply leaves', target: 'solutions' }
        ]
      }
    ],
    resources: [
      {
        title: 'Interactive Tools',
        items: [
          { icon: '⚡', label: 'ROI Savings Calculator', desc: 'Calculate time and dollars saved for your team', target: 'calculator' },
          { icon: '📝', label: 'Interactive Onboarding Tour', desc: 'Experience the 4-step digital onboarding tool', target: 'onboarding' },
          { icon: '✅', label: 'Live Setup Checklist', desc: 'Check requirements for company HR launch', target: 'onboarding-checklist' }
        ]
      },
      {
        title: 'Support & Knowledge',
        items: [
          { icon: '💡', label: 'Frequently Asked Questions', desc: 'Answers to common onboarding and security queries', target: 'faq' },
          { icon: '🤝', label: 'Book a Guided Demo', desc: 'Personal walkthrough with an HR specialist', target: 'book-demo' },
          { icon: '🔒', label: 'Security & Compliance', desc: 'Role-based access matrix, encryption & audit logs', target: 'compliance' }
        ]
      }
    ]
  };

  // Core Platform Modules (Pillars)
  featureModules: FeatureModule[] = [
    {
      id: 'employee-master',
      icon: '👥',
      tag: 'Core HR',
      title: 'Unified Employee Central',
      description: 'One secure source of truth for all employee records, personal information, bank accounts, designations, and company hierarchy.',
      benefits: [
        'Complete digital profiles & job histories',
        'Department & designation categorization',
        'Bulk employee imports & exports',
        'Built-in emergency contacts & bank details'
      ]
    },
    {
      id: 'time-attendance',
      icon: '⏱️',
      tag: 'Time & Attendance',
      title: 'Smart Attendance & Shift Rosters',
      description: 'Effortlessly track daily punches, manage complex multi-shift rotations, and eliminate attendance discrepancies with live logs.',
      benefits: [
        'Real-time daily punch-in & attendance logs',
        'Configurable shift masters with grace periods',
        'Automated shift schedule employee notifications',
        'Shift transactions & exchange management'
      ]
    },
    {
      id: 'leave-management',
      icon: '🌴',
      tag: 'Leave Tracking',
      title: 'Frictionless Leave Workflows',
      description: 'Empower employees to apply for leave with transparent balance counters and enable managers to approve or reject with one click.',
      benefits: [
        'Customizable leave categories (Casual, Sick, Earned)',
        'Live leave balance calculations & accruals',
        'Manager approval workflows with comments',
        'Central company holiday calendar'
      ]
    },
    {
      id: 'automated-payroll',
      icon: '💵',
      tag: 'Payroll & Tax',
      title: 'Automated Multi-Component Payroll',
      description: 'Run error-free payroll in minutes. Configure custom earning allowances, statutory deductions, bonuses, and generate compliant payslips.',
      benefits: [
        'Flexible salary component builder (HRA, DA, Special)',
        'Salary structure templates by department',
        'Instant payslip generation & payroll adjustments',
        'Yearly paid bonuses and settlement tracking'
      ]
    },
    {
      id: 'performance-review',
      icon: '🎯',
      tag: 'Performance & Reviews',
      title: '360° Appraisals & Goal Reviews',
      description: 'Foster workforce growth with continuous feedback, structured review cycles, objective rating criteria, and historical appraisal logs.',
      benefits: [
        'Structured review cycles with deadline tracking',
        'Self-assessments and manager appraisals',
        'Public review access links for external raters',
        'Detailed rating metrics and historical archive'
      ]
    },
    {
      id: 'security-permissions',
      icon: '🛡️',
      tag: 'Enterprise Security',
      title: 'Granular Role-Based Permissions',
      description: 'Keep your sensitive salary and workforce data protected with our dynamic permission matrix, secure JWT sessions, and audit controls.',
      benefits: [
        'Custom user roles with fine-grained page access',
        'Document category classification & vault',
        'Enterprise JWT authentication & password hashing',
        'Audit-ready transaction records'
      ]
    }
  ];

  // Pricing Plans
  plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Ideal for small startups & boutiques launching their HR stack',
      icon: '🌱',
      monthlyPrice: 0,
      yearlyPrice: 0,
      ctaText: 'Start for Free',
      features: [
        'Up to 10 active employees',
        'Core employee database & directory',
        'Web punch attendance tracking',
        'Standard leave request workflows',
        'Company holiday calendar',
        'Standard email support'
      ]
    },
    {
      id: 'growth',
      name: 'Growth & Business',
      tagline: 'Best for scaling organizations needing full payroll and shift management',
      icon: '🚀',
      popular: true,
      monthlyPrice: 18,
      yearlyPrice: 14,
      ctaText: 'Start 14-Day Free Trial',
      features: [
        'Up to 150 active employees',
        'Full-cycle automated payroll engine',
        'Custom salary structures & components',
        'Multi-shift rosters & schedule transaction logs',
        '360° Performance reviews & appraisals',
        'Document category vault & compliance storage',
        'Interactive employee onboarding portal',
        'Priority support & live onboarding assistance'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For large enterprises requiring tailored workflows, multi-company & SLA',
      icon: '🏢',
      monthlyPrice: 'Custom',
      yearlyPrice: 'Custom',
      ctaText: 'Contact Enterprise Sales',
      features: [
        'Unlimited employees & multi-company branches',
        'Custom permission matrix & role governance',
        'Dedicated customer success manager',
        'Custom salary revision and audit logs',
        'Automated scheduled email broadcasts',
        'Custom API access & database integrations',
        '99.95% Guaranteed uptime SLA'
      ]
    }
  ];

  // Customer Testimonials
  testimonials: Testimonial[] = [
    {
      quote: 'HRMS cut down our monthly payroll processing time from 3 grueling days to under 20 minutes. The shift scheduling and attendance sync are nothing short of phenomenal.',
      author: 'Aarav Patel',
      role: 'Head of People & Culture',
      company: 'TechNovus Solutions (320 Employees)',
      avatar: '👨‍💼',
      rating: 5
    },
    {
      quote: 'The interactive onboarding checklist and leave management portal gave our new hires an extraordinary experience from Day 1. It is the most intuitive HR tool we have used.',
      author: 'Sneha Deshmukh',
      role: 'Director of Operations',
      company: 'Apex Healthcare & Labs (180 Employees)',
      avatar: '👩‍💼',
      rating: 5
    },
    {
      quote: 'Having our salary structures, statutory tax deductions, and performance reviews in one clean system removed all the chaos of spreadsheets. Outstanding platform!',
      author: 'Vikram Mehta',
      role: 'Chief Executive Officer',
      company: 'CloudLogix Infotech',
      avatar: '🧑‍💻',
      rating: 5
    }
  ];

  // FAQ Items
  faqs: FaqItem[] = [
    {
      question: 'What is HRMS and what makes it different from traditional software?',
      answer: 'HRMS is a comprehensive cloud-based Human Resource Management System that unifies the entire employee lifecycle into one modern platform. Unlike disjointed tools, HRMS connects employee records, shift scheduling, real-time attendance, leave policies, salary structures, payroll execution, and 360° performance reviews without manual data re-entry.',
      category: 'General',
      open: true
    },
    {
      question: 'How quickly can our company set up and start using HRMS?',
      answer: 'You can be up and running in under 15 minutes! Use our built-in Onboarding Wizard to set up your company info, create departments, and import your employee roster via spreadsheet or manual entry. Your team can begin tracking attendance and processing payroll right away.',
      category: 'Setup',
      open: false
    },
    {
      question: 'Can we configure custom salary allowances, deductions, and shift patterns?',
      answer: 'Yes, absolutely! HRMS includes a dynamic Salary Component builder allowing you to configure Basic Pay, HRA, Travel Allowance, Special Allowances, PF, ESI, and custom deductions. You can assign these to custom salary structures and handle multiple shift schedules with automated notifications.',
      category: 'Payroll',
      open: false
    },
    {
      question: 'Does HRMS provide employee self-service capabilities?',
      answer: 'Yes! Employees can log in to check their attendance logs, punch in/out, view allotted leave balances, submit leave requests with reason notes, view historical payslips, and participate in scheduled performance review cycles.',
      category: 'Features',
      open: false
    },
    {
      question: 'How does HRMS ensure security and privacy of sensitive salary data?',
      answer: 'We employ enterprise-grade encryption in transit and at rest, secure JWT token-based authentication, and a granular Role-Based Permission Matrix. This ensures only authorized HR administrators can view or edit sensitive salary, document, and appraisal data.',
      category: 'Security',
      open: false
    },
    {
      question: 'Can I try HRMS before committing to a paid plan?',
      answer: 'Yes! Our Starter Plan is completely free forever for up to 10 employees. Additionally, we provide a 14-day full-access trial for our Growth plan with no credit card required, as well as an interactive live Onboarding and Checklist preview on this website.',
      category: 'Pricing',
      open: false
    }
  ];

  // Quick Stats
  metrics = [
    { value: '500+', label: 'Organizations Powered', icon: '🏢' },
    { value: '99.9%', label: 'Payroll Calculation Accuracy', icon: '✅' },
    { value: '75%', label: 'Onboarding Time Saved', icon: '⚡' },
    { value: '4.9/5', label: 'Customer Satisfaction Score', icon: '⭐' }
  ];

  // Live Payroll Calculation in Hero Preview
  get previewGrossSalary(): number {
    return this.baseSalary + this.hraAllowance + this.specialAllowance;
  }

  get previewTotalDeductions(): number {
    return this.pfDeduction + this.taxDeduction;
  }

  get previewNetSalary(): number {
    return this.previewGrossSalary - this.previewTotalDeductions;
  }

  // Interactive ROI Calculator Calculations
  get calculatedHoursSavedPerMonth(): number {
    return Math.round(this.calculatorEmployees * 0.75);
  }

  get calculatedPayrollTime(): string {
    return this.calculatorEmployees > 100 ? '25 minutes' : '15 minutes';
  }

  get calculatedAnnualDollarSavings(): number {
    // Estimating average $28/hr saved on HR administrative time + error reduction
    return Math.round(this.calculatedHoursSavedPerMonth * 12 * 28);
  }

  // Master Navigation Handler
  go(target: string, label?: string): void {
    this.menuOpen = null;
    this.mobileMenuOpen = false;

    // Special action targets
    if (target === 'book-demo') {
      this.openDemoModal();
      return;
    }

    if (target === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Direct Route Targets
    const directRoutes: { [key: string]: string } = {
      'login': '/login',
      'register': '/register',
      'company-register': '/register',
      'dashboard': '/dashboard',
      'onboarding': '/onboarding',
      'onboarding-checklist': '/onboarding-checklist',
      'employee-profiles': '/employee-profiles',
      'plans': '/subscriptions/plans',
      'subscription-plans': '/subscriptions/plans'
    };

    if (directRoutes[target]) {
      this.router.navigate([directRoutes[target]]);
      return;
    }

    // Scroll to on-page anchor section
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Fallback toast if section does not exist
    this.showToast(`${label || this.pretty(target)}: Exploring feature...`);
  }

  // Auth Card Handlers (Google, Apple, Email, Desktop App)
  continueWithEmail(): void {
    if (!this.loginEmail || !this.loginEmail.trim()) {
      this.showToast('Please enter your email to continue.');
      return;
    }
    const email = this.loginEmail.trim();
    if (!email.includes('@')) {
      this.showToast('Please enter a valid work email.');
      return;
    }
    this.showToast(`Signing in with ${email}...`);
    this.router.navigate(['/login'], { queryParams: { email } });
  }

  continueWithGoogle(): void {
    this.showToast('Connecting to Google Single Sign-On...');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 600);
  }

  continueWithApple(): void {
    this.showToast('Connecting to Apple Single Sign-On...');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 600);
  }

  downloadDesktopApp(): void {
    this.showToast('HRMS Desktop application installer (Windows x64) started.');
  }

  // Punch In/Out simulation for the hero attendance preview
  togglePunch(): void {
    this.isPunchedIn = !this.isPunchedIn;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    this.punchTime = `${hours}:${minutes} ${ampm}`;
    this.showToast(this.isPunchedIn ? 'Successfully punched in!' : 'Successfully punched out!');
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  toggleMenu(key: string): void {
    this.menuOpen = this.menuOpen === key ? null : key;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  openDemoModal(): void {
    this.isDemoModalOpen = true;
    this.demoSubmitted = false;
  }

  closeDemoModal(): void {
    this.isDemoModalOpen = false;
  }

  submitDemoForm(): void {
    if (!this.demoForm.name || !this.demoForm.email) {
      this.showToast('Please provide your name and work email.');
      return;
    }
    this.demoSubmitted = true;
    setTimeout(() => {
      // Auto close after 3 seconds or keep visible
    }, 3000);
  }

  submitNewsletter(): void {
    if (!this.newsletterEmail || !this.newsletterEmail.includes('@')) {
      this.showToast('Please enter a valid work email.');
      return;
    }
    this.newsletterSuccess = true;
    this.newsletterEmail = '';
    this.showToast('Thank you! You are now subscribed for HR product updates.');
  }

  showToast(msg: string): void {
    this.toastMsg = msg;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMsg = null), 2800);
  }

  private pretty(t: string): string {
    return t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-item-dropdown, .mega-menu, .mobile-toggle, .mobile-nav-drawer')) {
      this.menuOpen = null;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen = null;
    this.mobileMenuOpen = false;
    this.closeDemoModal();
  }
}
