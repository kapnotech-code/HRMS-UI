import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../core/services/Sidebar.service';
import { FrontendPermissionService } from '../../core/services/frontend-permission.service';

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
      ]
    },
    {
      label: 'Recruiter',
      open: false,
      items: [
        { label: 'Employee', icon: '👨‍💼', route: '/Recruiter/employee-master' },
        { label: 'Report', icon: '📑', route: '/Recruiter/Report' },
        { label: 'Salary Component', icon: '💵', route: '/Recruiter/salary-component' },
        { label: 'Salary Structure', icon: '🧩', route: '/Recruiter/salary-structure' },
        { label: 'Structure Components', icon: '🔗', route: '/Recruiter/salary-structure-components' },
        { label: 'Employee Salary', icon: '🧾', route: '/Recruiter/employee-salary' },
        { label: 'Employee Salary Components', icon: '💰', route: '/Recruiter/employee-salary-components' },
        { label: 'Salary Revisions', icon: '📈', route: '/Recruiter/salary-revisions' },
        { label: 'Payroll', icon: '📈', route: '/Recruiter/payroll' },
        { label: 'Payroll Details', icon: '🧾', route: '/Recruiter/payroll-details' },
        { label: 'Payroll Adjustment', icon: '⚙️', route: '/Recruiter/payroll-adjustment' },
      ]
    },
    {
      label: 'Payroll',
      open: false,
      items: [
        { label: 'Salary Component', icon: '💰', route: '/payroll/salary' },
      ]
    }
  ];

  visibleTopLevel: SidebarItem[] = [];
  visibleMenuGroups: typeof this.menuGroups = [];

  constructor(
    public sidebarService: SidebarService,
    private frontendPerm: FrontendPermissionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.visibleTopLevel = [];
    this.visibleMenuGroups = [];
    this.filterMenuByPermissions();
  }

  private filterMenuByPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();

    if (roleId === 1) {
      this.visibleTopLevel = this.topLevelItems;
      this.visibleMenuGroups = this.menuGroups;
      this.cdr.detectChanges();
      return;
    }

    if (!roleId) {
      this.visibleTopLevel = this.topLevelItems;
      this.visibleMenuGroups = [];
      this.cdr.detectChanges();
      return;
    }

    this.frontendPerm.initialize().subscribe({
      next: () => {
        this.frontendPerm.loadPermissionsForRole(roleId).subscribe({
          next: () => {
            this.applyPermissionFilter(roleId);
            this.cdr.detectChanges();
          },
          error: () => {
            this.visibleTopLevel = [];
            this.visibleMenuGroups = [];
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.visibleTopLevel = [];
        this.visibleMenuGroups = [];
        this.cdr.detectChanges();
      }
    });
  }

  private applyPermissionFilter(roleId: number): void {
    if (roleId === 1) {
      this.visibleTopLevel = this.topLevelItems;
      this.visibleMenuGroups = this.menuGroups;
      return;
    }

    this.visibleTopLevel = this.topLevelItems.filter(item =>
      item.route === '/dashboard' || this.frontendPerm.canAccessRoute(item.route)
    );

    this.visibleMenuGroups = this.menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          this.frontendPerm.canAccessRoute(item.route)
        )
      }))
      .filter(group => group.items.length > 0);
  }
}
