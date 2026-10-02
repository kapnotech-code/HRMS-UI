import { Routes } from '@angular/router';
import { authGuard } from '../core/guard/auth.guard';
import { permissionGuard } from '../core/guard/permission.guard';
import { devOnlyGuard } from '../core/guard/dev.guard';

const guarded = [authGuard, permissionGuard];

export const appShellRoutes: Routes = [
  {
    path: 'dashboard',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Dasboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'settings/branding',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Settings/branding-settings.component').then(m => m.BrandingSettingsComponent)
  },
  {
    path: 'ui-kit',
    canMatch: [devOnlyGuard],
    loadComponent: () =>
      import('../ features/UiKit/ui-kit.component').then(m => m.UiKitComponent)
  },
  {
    path: 'masters/designation',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/designation/DesignationList/DesignationList').then(m => m.DesignationList)
  },
  {
    path: 'masters/department',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Department/DepartmentList/DepartmentList').then(m => m.DepartmentList)
  },
  {
    path: 'masters/company',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Companylist/Companylist').then(m => m.CompanyList)
  },
  {
    path: 'masters/bank',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Banklist/Banklist').then(m => m.BankList)
  },
  {
    path: 'masters/shifts',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Shifts/ShiftList/ShiftList').then(m => m.ShiftList)
  },
  {
    path: 'masters/holiday',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Holiday/HolidayList/HolidayList').then(m => m.HolidayList)
  },
  {
    path: 'masters/attendance',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Attendance/AttendanceList/AttendanceList').then(m => m.AttendanceList)
  },
  {
    path: 'masters/leavetype',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Leavetype/leavetype').then(m => m.LeaveTypeList)
  },
  {
    path: 'masters/schedule-master',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/ScheduleMaster/ScheduleMasterList/ScheduleMasterList').then(m => m.ScheduleMasterList)
  },
  {
    path: 'master/documents',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/documents/documents.component').then(m => m.DocumentsComponent)
  },
  {
    path: 'masters/document-category',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/document-category/document-category.component').then(m => m.DocumentCategoryComponent)
  },
  {
    path: 'masters/menus',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Menu/Menu-Form-Component').then(m => m.MenuFormComponent)
  },
  {
    path: 'masters/users',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/User/User-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'masters/users/new',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/User-form/User-form.component').then(m => m.UserFormComponent)
  },
  {
    path: 'masters/users/edit/:id',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/User-form/User-form.component').then(m => m.UserFormComponent)
  },
  {
    path: 'masters/pages',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/page/page-master.component').then(m => m.PageMasterComponent)
  },
  {
    path: 'masters/permission-matrix',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Permission/permission-matrix.component').then(m => m.PermissionList)
  },
  {
    path: 'transactions/employee-shift',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Transaction/Employeeshiftlist').then(m => m.EmployeeShiftListComponent)
  },
  {
    path: 'transactions/master-attendance',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Transaction/AttendanceLists/AttendancesList').then(m => m.AttendancesLists)
  },
  {
    path: 'transactions/leave-transactions',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Transaction/Leave_transaction/Leave transaction.component').then(m => m.LeaveTransactionComponent)
  },
  {
    path: 'transactions/schedule-employee',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/ScheduleMaster/ScheduleEmployee/ScheduleEmployeeList').then(m => m.ScheduleEmployeeListComponent)
  },
  {
    path: 'transactions/schedule-employee/:id',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/ScheduleMaster/ScheduleEmployee/ScheduleEmployee').then(m => m.ScheduleEmployeeComponent)
  },
  {
    path: 'transactions/schedule-transaction',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Transaction/ScheduleTransaction/ScheduleTransaction').then(m => m.ScheduleTransactionComponent)
  },
  {
    path: 'transactions/schedule-email',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Transaction/ScheduleEmail/ScheduleEmail').then(m => m.ScheduleEmailComponent)
  },
  {
    path: 'transactions/yearly-paid',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Transaction/YearlyPaid/YearlyPaid').then(m => m.YearlyPaidComponent)
  },
  {
    path: 'transactions/document-types',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Master/Documentsnew/documents-typesnew.component').then(m => m.DocumentComponent)
  },
  {
    path: 'Recruiter/employee-master',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/employee-master/ employee-master.component').then(m => m.EmployeeMasterComponent)
  },
  {
    path: 'Recruiter/employee-import',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/employee-import/employee-import.component').then(m => m.EmployeeImportComponent)
  },
  {
    path: 'Recruiter/employee-master/:id',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/employee-master/ employee-master.component').then(m => m.EmployeeMasterComponent)
  },
  {
    path: 'Recruiter/employee-profile/:id',
    canActivate: guarded,
    loadComponent: () =>
      import('../features/Recruiter/employee-profile/employee-profile.component').then(m => m.EmployeeProfileComponent)
  },
  {
    path: 'Recruiter/Report',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/Report/Employee-report.component').then(m => m.EmployeeReportComponent)
  },
  {
    path: 'Recruiter/salary-component',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/salary-component-list.component/salary-component-list.component').then(m => m.SalaryComponentListComponent)
  },
  {
    path: 'Recruiter/salary-structure-components',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/salarystructurecomponent/Salary structure component list.component').then(m => m.SalaryStructureComponentListComponent)
  },
  {
    path: 'Recruiter/salary-structure',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/salary-structure-list/salary-structure-list.component').then(m => m.SalaryStructurePageComponent)
  },
  {
    path: 'Recruiter/payroll-details',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/payrolldetail/payrolldetail.component').then(m => m.PayrollDetailsComponent)
  },
  {
    path: 'Recruiter/payroll-adjustment',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/payroll-adjustment/payroll-adjustment.component').then(m => m.PayrollAdjustmentComponent)
  },
  {
    path: 'Recruiter/payroll',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/payroll/payroll.component').then(m => m.PayrollComponent)
  },
  {
    path: 'Recruiter/salary-revisions',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/Salary revision/Salary revision list.component').then(m => m.SalaryRevisionListComponent)
  },
  {
    path: 'Recruiter/employee-salary',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/Employee_salary/Employee salary page.component').then(m => m.EmployeeSalaryPageComponent)
  },
  {
    path: 'Recruiter/employee-salary-components',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/employee-salary-components/employee-salary-components.component').then(m => m.EmployeeSalaryComponentsComponent)
  },
  {
    path: 'payroll/salary',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Recruiter/salary-component-list.component/salary-component-list.component').then(m => m.SalaryComponentListComponent)
  },
  {
    path: 'subscriptions/my-subscription',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Subscriptions/MySubscription/my-subscription.component').then(m => m.MySubscriptionComponent)
  },
  {
    path: 'admin/revenue',
    canActivate: guarded,
    loadComponent: () =>
      import('../ features/Admin/admin-revenue.component').then(m => m.AdminRevenueComponent)
  },
  {
    path: 'transactions/review',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../ features/Reviews/ReviewDashboard/review-dashboard.component').then(m => m.ReviewDashboardComponent)
  },
  {
    path: 'transactions/review/pending',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../ features/Reviews/PendingReviews/pending-reviews.component').then(m => m.PendingReviewsComponent)
  },
  {
    path: 'transactions/review/history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../ features/Reviews/ReviewHistory/review-history.component').then(m => m.ReviewHistoryComponent)
  },
  {
    path: 'transactions/review/details/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../ features/Reviews/ReviewDetails/review-details.component').then(m => m.ReviewDetailsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
