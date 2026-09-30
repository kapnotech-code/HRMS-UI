import { Routes } from '@angular/router';
import { DashboardComponent } from './ features/Dasboard/dashboard.component';
import { DepartmentList } from './ features/Master/Department/DepartmentList/DepartmentList';
import { DesignationList } from './ features/Master/designation/DesignationList/DesignationList';
import { ShiftList } from './ features/Master/Shifts/ShiftList/ShiftList';
import { HolidayList } from './ features/Master/Holiday/HolidayList/HolidayList';
import { AttendanceList } from './ features/Master/Attendance/AttendanceList/AttendanceList';
import { LeaveTypeList } from './ features/Master/Leavetype/leavetype';
import { CompanyList } from './ features/Master/Companylist/Companylist';
import { BankList } from './ features/Master/Banklist/Banklist';
import { ScheduleMasterList } from './ features/Master/ScheduleMaster/ScheduleMasterList/ScheduleMasterList';
import { ScheduleEmployeeComponent } from './ features/Master/ScheduleMaster/ScheduleEmployee/ScheduleEmployee';
import { ScheduleEmployeeListComponent } from './ features/Master/ScheduleMaster/ScheduleEmployee/ScheduleEmployeeList';
import { ScheduleTransactionComponent } from './ features/Transaction/ScheduleTransaction/ScheduleTransaction';
import { ScheduleEmailComponent } from './ features/Transaction/ScheduleEmail/ScheduleEmail';
import { YearlyPaidComponent } from './ features/Transaction/YearlyPaid/YearlyPaid';
import { EmployeeShiftListComponent } from './ features/Transaction/Employeeshiftlist';
import { AttendancesLists } from './ features/Transaction/AttendanceLists/AttendancesList';
import { LeaveTransactionComponent } from './ features/Transaction/Leave_transaction/Leave transaction.component';
import { EmployeeReportComponent } from './ features/Recruiter/Report/Employee-report.component';
import { Login } from './ features/Login/Login';
import { PermissionList } from './ features/Permission/permission-matrix.component';
import { authGuard } from './core/guard/auth.guard';
import { permissionGuard } from './core/guard/permission.guard';
import { PageMasterComponent } from './ features/Master/page/page-master.component';
import { SalaryComponentListComponent } from './ features/Recruiter/salary-component-list.component/salary-component-list.component';
import { UserListComponent } from './ features/Master/User/User-list.component';
import { UserFormComponent } from './ features/Master/User-form/User-form.component';
import { MenuFormComponent } from './ features/Master/Menu/Menu-Form-Component';
import { DocumentsComponent } from './ features/Master/documents/documents.component';
import { DocumentCategoryComponent } from './ features/Master/document-category/document-category.component';
import { DocumentComponent } from './ features/Master/Documentsnew/documents-typesnew.component';
import { Register } from './ features/REgister/Register';
import { SalaryStructureComponentListComponent } from './ features/Recruiter/salarystructurecomponent/Salary structure component list.component';
import { SalaryStructurePageComponent } from './ features/Recruiter/salary-structure-list/salary-structure-list.component';
import { EmployeeSalaryPageComponent } from './ features/Recruiter/Employee_salary/Employee salary page.component';
import { SalaryRevisionListComponent } from './ features/Recruiter/Salary revision/Salary revision list.component';
import { PayrollComponent } from './ features/Recruiter/payroll/payroll.component';
import { EmployeeSalaryComponentsComponent } from './ features/Recruiter/employee-salary-components/employee-salary-components.component';
import { PayrollDetailsComponent } from './ features/Recruiter/payrolldetail/payrolldetail.component';
import { PayrollAdjustmentComponent } from './ features/Recruiter/payroll-adjustment/payroll-adjustment.component';
import { SubscriptionPlansComponent } from './ features/Subscriptions/SubscriptionPlans/subscription-plans.component';
import { MySubscriptionComponent } from './ features/Subscriptions/MySubscription/my-subscription.component';
import { ReviewDashboardComponent } from './ features/Reviews/ReviewDashboard/review-dashboard.component';
import { PendingReviewsComponent } from './ features/Reviews/PendingReviews/pending-reviews.component';
import { ReviewHistoryComponent } from './ features/Reviews/ReviewHistory/review-history.component';
import { ReviewDetailsComponent } from './ features/Reviews/ReviewDetails/review-details.component';
import { OnboardingChecklistComponent } from './ features/Landing/onboarding-checklist/onboarding-checklist.component';
import { EmployeeProfileComponent } from './features/Recruiter/employee-profile/employee-profile.component';
import { EmployeeMasterComponent } from './ features/Recruiter/employee-master/ employee-master.component';
import { EmployeeImportComponent } from './ features/Recruiter/employee-import/employee-import.component';
import { LandingComponent } from './ features/Landing/landing.component';
import { OnboardingComponent } from './ features/Landing/onboarding/onboarding.component';

export const routes: Routes = [
  // Landing (public homepage)
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: LandingComponent,
  },
  {
    path: 'landing',
    component: LandingComponent,
  },
  {
    path: 'onboarding',
    component: OnboardingComponent,
  },
  {
    path: 'onboarding-checklist',
    component: OnboardingChecklistComponent,
  },
  {
    path: 'employee-profiles',
    component: EmployeeProfileComponent,
  },

  // Login
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'company-register',
    component: Register,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, permissionGuard],
  },

  // Master Routes
  {
    path: 'masters/designation',
    component: DesignationList,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/department',
    component: DepartmentList,
    canActivate: [authGuard, permissionGuard],
  },
  { path: 'masters/company', component: CompanyList, canActivate: [authGuard, permissionGuard] },
  { path: 'masters/bank', component: BankList, canActivate: [authGuard, permissionGuard] },
  { path: 'masters/shifts', component: ShiftList, canActivate: [authGuard, permissionGuard] },
  { path: 'masters/holiday', component: HolidayList, canActivate: [authGuard, permissionGuard] },
  {
    path: 'masters/attendance',
    component: AttendanceList,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/leavetype',
    component: LeaveTypeList,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/schedule-master',
    component: ScheduleMasterList,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'master/documents',
    component: DocumentsComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/document-category',
    component: DocumentCategoryComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/menus',
    component: MenuFormComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/users',
    component: UserListComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/users/new',
    component: UserFormComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/users/edit/:id',
    component: UserFormComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/pages',
    component: PageMasterComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'masters/permission-matrix',
    component: PermissionList,
    canActivate: [authGuard, permissionGuard],
  },

  // Transaction Routes
  {
    path: 'transactions/employee-shift',
    component: EmployeeShiftListComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/master-attendance',
    component: AttendancesLists,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/leave-transactions',
    component: LeaveTransactionComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/schedule-employee',
    component: ScheduleEmployeeListComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/schedule-employee/:id',
    component: ScheduleEmployeeComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/schedule-transaction',
    component: ScheduleTransactionComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/schedule-email',
    component: ScheduleEmailComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/yearly-paid',
    component: YearlyPaidComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'transactions/document-types',
    component: DocumentComponent,
    canActivate: [authGuard, permissionGuard],
  },

  // Recruiter Routes
  {
    path: 'Recruiter/employee-master',
    component: EmployeeMasterComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/employee-import',
    component: EmployeeImportComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/employee-master/:id',
    component: EmployeeMasterComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/employee-profile/:id',
    component: EmployeeProfileComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/Report',
    component: EmployeeReportComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/salary-component',
    component: SalaryComponentListComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/salary-structure-components',
    component: SalaryStructureComponentListComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/salary-structure',
    component: SalaryStructurePageComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/payroll-details',
    component: PayrollDetailsComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/payroll-adjustment',
    component: PayrollAdjustmentComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/payroll',
    component: PayrollComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/salary-revisions',
    component: SalaryRevisionListComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/employee-salary',
    component: EmployeeSalaryPageComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'Recruiter/employee-salary-components',
    component: EmployeeSalaryComponentsComponent,
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'payroll/salary',
    component: SalaryComponentListComponent,
    canActivate: [authGuard, permissionGuard],
  },
  { path: 'subscriptions/plans', component: SubscriptionPlansComponent },
  { path: 'plans', component: SubscriptionPlansComponent },
  {
    path: 'subscriptions/my-subscription',
    component: MySubscriptionComponent,
    canActivate: [authGuard, permissionGuard],
  },
  { path: 'transactions/review', component: ReviewDashboardComponent, canActivate: [authGuard] },
  {
    path: 'transactions/review/pending',
    component: PendingReviewsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'transactions/review/history',
    component: ReviewHistoryComponent,
    canActivate: [authGuard],
  },
  {
    path: 'transactions/review/details/:id',
    component: ReviewDetailsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'review/public/:id',
    component: ReviewDetailsComponent,
  },
  { path: '**', redirectTo: 'dashboard' },
];
