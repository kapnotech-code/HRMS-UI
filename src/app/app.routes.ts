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
import { EmployeeShiftListComponent } from './ features/Transaction/Employeeshiftlist';
import { AttendancesLists } from './ features/Transaction/AttendanceLists/AttendancesList';
import { LeaveTransactionComponent } from './ features/Transaction/Leave_transaction/Leave transaction.component';
import { EmployeeMasterComponent } from './ features/Recruiter/employee-master/ employee-master.component';
import { EmployeeReportComponent } from './ features/Recruiter/Report/Employee report.component';
import { Login } from './ features/Login/Login';
import { PermissionList } from './ features/Permission/permission-matrix.component';
import { authGuard } from './core/guard/ auth.guard';
import { PageMasterComponent } from './ features/Master/page/page-master.component';

import { UserListComponent } from './ features/Master/User/User-list.component';
import { UserFormComponent } from './ features/Master/User-form/User-form.component';
import { MenuFormComponent } from './ features/Master/Menu/Menu-Form-Component';//import { PageList } from './';
//import { PermissionMatrix } from './features/Master/permission/PermissionMatrix/PermissionMatrix';
import { DocumentsComponent } from './ features/Master/documents/documents.component'; 
import { DocumentCategoryComponent } from './ features/Master/document-category/document-category.component';
import { DocumentComponent } from './ features/Master/Documentsnew/documents-typesnew.component';
import { Register } from './ features/REgister/Register';

export const routes: Routes = [

  // Login
  {
    path: 'login',
    component: Login
  },


  // Default
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    component: Register
  },

  {
    path: 'dashboard',
    component: DashboardComponent
  },
  // Master Routes

  { path: 'masters/designation', component: DesignationList },
  { path: 'masters/department', component: DepartmentList },
  { path: 'masters/company', component: CompanyList },
  { path: 'masters/bank', component: BankList },
  { path: 'masters/shifts', component: ShiftList },
  { path: 'masters/holiday', component: HolidayList },
  { path: 'masters/attendance', component: AttendanceList },
  { path: 'masters/leavetype', component: LeaveTypeList },
  { path: 'master/documents', component: DocumentsComponent },
  {
    path: 'masters/document-category',
    component: DocumentCategoryComponent,
    //canActivate: [authGuard]
  },
  {
    path: 'masters/menus',
    component: MenuFormComponent
  },
  { path: 'masters/users', component: UserListComponent },
  { path: 'masters/users/new', component: UserFormComponent},
  { path: 'masters/users/edit/:id', component: UserFormComponent },

  {
    path: 'masters/pages',
    component: PageMasterComponent
  },
  
  {
   
    path: 'masters/permission-matrix',
    component: PermissionList
  },
  // Transaction Routes
  { path: 'transactions/employee-shift', component: EmployeeShiftListComponent },
  { path: 'transactions/master-attendance', component: AttendancesLists },
  { path: 'transactions/leave-transactions', component: LeaveTransactionComponent },
  {
    path: 'transactions/document-types',
    component: DocumentComponent,
   
  },

  // Recruiter Routes
  { path: 'Recruiter/employee-master', component: EmployeeMasterComponent },
  { path: 'Recruiter/employee-master/:id', component: EmployeeMasterComponent },
  { path: 'Recruiter/Report', component: EmployeeReportComponent },
  // Wildcard Route
  { path: '**', redirectTo: 'dashboard' }
];
