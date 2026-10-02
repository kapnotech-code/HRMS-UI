import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../core/services/Sidebar.service';
import { FrontendPermissionService } from '../../core/services/frontend-permission.service';
import { SubscriptionEntitlementService } from '../../core/services/subscription-entitlement.service';
import { featureForRoute } from '../rbac/permission-matrix';
import { environment } from '../../../environments/environment';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {

  topLevelItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      icon: '📊',
      route: '/dashboard'
    }
  ];

  menuGroups = [
    {
      label: 'Masters',
      open: true,
      items: [
        { label: 'Company', icon: '🏬', route: '/masters/company' },
        { label: 'Branding', icon: '🎨', route: '/settings/branding' },
        { label: 'Documents', icon: '📁', route: '/master/documents' },
        { label: 'Users', icon: '👤', route: '/masters/users' },
        { label: 'Document Category', icon: '📁', route: '/masters/document-category' },
        { label: 'Bank', icon: '🏦', route: '/masters/bank' },
        { label: 'Shifts', icon: '⏰', route: '/masters/shifts' },
        { label: 'Departments', icon: '🏢', route: '/masters/department' },
        { label: 'Designations', icon: '🎖️', route: '/masters/designation' },
        { label: 'Holiday', icon: '📅', route: '/masters/holiday' },
        { label: 'Leave Type', icon: '📄', route: '/masters/leavetype' },
        { label: 'Menus', icon: '📄', route: '/masters/menus' },
        { label: 'Role Permission', icon: '🔐', route: '/masters/permission-matrix' },
        { label: 'Pages', icon: '📄', route: '/masters/pages' },
      ]
    },
    {
      label: 'Transactions',
      open: false,
      items: [
        { label: 'Employee Shift', icon: '🔁', route: '/transactions/employee-shift' },
        { label: 'Document Types', icon: '📄', route: '/transactions/document-types' },
        { label: 'Report Attendance', icon: '🕒', route: '/transactions/master-attendance' },
        { label: 'Leave', icon: '🏖️', route: '/transactions/leave-transactions' },
        { label: 'Mark Attendance', icon: '🕒', route: '/masters/attendance' },
        { label: 'Schedule Master', icon: '🗓️', route: '/masters/schedule-master' },
        { label: 'Schedule Employee', icon: '👥', route: '/transactions/schedule-employee' },
        { label: 'Schedule Transaction', icon: '📝', route: '/transactions/schedule-transaction' },
        { label: 'Schedule Email', icon: '✉️', route: '/transactions/schedule-email' },
        { label: 'Yearly Paid', icon: '💰', route: '/transactions/yearly-paid' },
        
      ]
    },
    {
      label: 'Reviews',
      open: false,
      items: [
        { label: 'Review Dashboard', icon: '📊', route: '/transactions/review' },
        { label: 'Pending Reviews', icon: '⏳', route: '/transactions/review/pending' },
        
        { label: 'Review History', icon: '🕘', route: '/transactions/review/history' },
      ]
    },
    {
      label: 'Recruiter',
      open: false,
      items: [
        { label: 'Employee', icon: '👨‍💼', route: '/Recruiter/employee-master' },
        { label: 'Import Employees', icon: '⬆', route: '/Recruiter/employee-import' },
        { label: 'Report', icon: '📑', route: '/Recruiter/Report' },
       
       ]
    },
    {
      label: 'Payroll',
      open: false,
      items: [

        { label: 'Salary Component', icon: '💰', route: '/payroll/salary' },
        { label: 'Payroll', icon: '📈', route: '/Recruiter/payroll' },
        { label: 'Payroll Details', icon: '🧾', route: '/Recruiter/payroll-details' },
        { label: 'Payroll Adjustment', icon: '⚙️', route: '/Recruiter/payroll-adjustment' },
        { label: 'Salary Component', icon: '💵', route: '/Recruiter/salary-component' },
        { label: 'Salary Structure', icon: '🧩', route: '/Recruiter/salary-structure' },
        { label: 'Structure Components', icon: '🔗', route: '/Recruiter/salary-structure-components' },
        { label: 'Employee Salary', icon: '🧾', route: '/Recruiter/employee-salary' },
        { label: 'Employee Salary Components', icon: '💰', route: '/Recruiter/employee-salary-components' },
        { label: 'Salary Revisions', icon: '📈', route: '/Recruiter/salary-revisions' },
      ]

    },
    {
      label: 'Subscriptions',
      open: false,
      items: [
        { label: 'Subscription Plans', icon: '📋', route: '/subscriptions/plans' },
        { label: 'My Subscription', icon: '👤', route: '/subscriptions/my-subscription' },
      ]
    },
    {
      label: 'Platform',
      open: true,
      items: [
        { label: 'Revenue', icon: '📈', route: '/admin/revenue' },
      ]
    }
  ];

  visibleTopLevel: SidebarItem[] = [];
  visibleMenuGroups: typeof this.menuGroups = [];

  constructor(
    public sidebarService: SidebarService,
    private frontendPerm: FrontendPermissionService,
    private entitlement: SubscriptionEntitlementService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.visibleTopLevel = [];
    this.visibleMenuGroups = [];
    this.filterMenuByPermissions();
  }

  private filterMenuByPermissions(): void {
    this.frontendPerm.loadMatrix().subscribe({
      next: () => {
        this.entitlement.load().subscribe({
          next: () => {
            this.applyPermissionFilter();
            this.cdr.detectChanges();
          },
          error: () => {
            this.applyPermissionFilter();
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.visibleTopLevel = this.topLevelItems;
        this.visibleMenuGroups = [];
        this.cdr.detectChanges();
      }
    });
  }

  private applyPermissionFilter(): void {
    const extra: SidebarItem[] = environment.production
      ? []
      : [{ label: 'UI kit', icon: '🧩', route: '/ui-kit' }];

    this.visibleTopLevel = [...this.topLevelItems, ...extra].filter(item =>
      item.route === '/dashboard' || item.route === '/ui-kit' || this.frontendPerm.canAccessRoute(item.route)
    );

    this.visibleMenuGroups = this.menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          this.frontendPerm.canAccessRoute(item.route) && this.canAccessFeature(item.route)
        )
      }))
      .filter(group => group.items.length > 0);
  }

  private canAccessFeature(route: string): boolean {
    const feature = featureForRoute(route);
    if (!feature) {
      return true;
    }
    return this.entitlement.hasFeature(feature);
  }
}
