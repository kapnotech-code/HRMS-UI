export const RoleCodes = {
  SuperAdmin: 'SUPER_ADMIN',
  CompanyAdmin: 'COMPANY_ADMIN',
  HrManager: 'HR_MANAGER',
  Manager: 'MANAGER',
  Employee: 'EMPLOYEE'
} as const;

export type RoleCode = (typeof RoleCodes)[keyof typeof RoleCodes];

export function roleCodeFromRoleId(roleId: number | null | undefined): RoleCode {
  switch (roleId) {
    case 1:
    case 6:
      return RoleCodes.CompanyAdmin;
    case 2:
      return RoleCodes.HrManager;
    case 3:
      return RoleCodes.Employee;
    case 4:
      return RoleCodes.Manager;
    case 5:
      return RoleCodes.SuperAdmin;
    default:
      return RoleCodes.Employee;
  }
}

const SUPER_ADMIN = [
  'dashboard.read',
  'platform.companies',
  'platform.plans',
  'platform.billing',
  'platform.analytics',
  'company.read',
  'subscription.read',
  'subscription.manage',
  'user.read'
];

const COMPANY_ADMIN = [
  'dashboard.read',
  'company.read',
  'company.update',
  'employee.read',
  'employee.create',
  'employee.update',
  'employee.delete',
  'attendance.read',
  'attendance.create',
  'attendance.update',
  'attendance.approve',
  'leave.read',
  'leave.create',
  'leave.update',
  'leave.approve',
  'payroll.read',
  'payroll.process',
  'payslip.read',
  'recruitment.read',
  'recruitment.manage',
  'document.read',
  'document.manage',
  'user.read',
  'user.invite',
  'user.update',
  'user.disable',
  'department.read',
  'department.manage',
  'designation.read',
  'designation.manage',
  'shift.read',
  'shift.manage',
  'holiday.read',
  'holiday.manage',
  'leavetype.read',
  'leavetype.manage',
  'bank.read',
  'bank.manage',
  'permission.manage',
  'review.read',
  'review.manage',
  'schedule.read',
  'schedule.manage',
  'subscription.read',
  'subscription.manage'
];

const HR_MANAGER = [
  'dashboard.read',
  'company.read',
  'employee.read',
  'employee.create',
  'employee.update',
  'employee.delete',
  'attendance.read',
  'attendance.create',
  'attendance.update',
  'attendance.approve',
  'leave.read',
  'leave.create',
  'leave.update',
  'leave.approve',
  'payroll.read',
  'payroll.process',
  'payslip.read',
  'recruitment.read',
  'recruitment.manage',
  'document.read',
  'document.manage',
  'user.read',
  'user.invite',
  'department.read',
  'department.manage',
  'designation.read',
  'designation.manage',
  'shift.read',
  'shift.manage',
  'holiday.read',
  'holiday.manage',
  'leavetype.read',
  'leavetype.manage',
  'bank.read',
  'bank.manage',
  'review.read',
  'review.manage',
  'schedule.read'
];

const MANAGER = [
  'dashboard.read',
  'employee.read',
  'attendance.read',
  'attendance.update',
  'attendance.approve',
  'leave.read',
  'leave.approve',
  'review.read'
];

const EMPLOYEE = [
  'dashboard.read',
  'employee.read',
  'attendance.read',
  'attendance.create',
  'leave.read',
  'leave.create',
  'payslip.read',
  'document.read'
];

export const LOCAL_PERMISSION_MATRIX: Record<RoleCode, string[]> = {
  SUPER_ADMIN: SUPER_ADMIN,
  COMPANY_ADMIN: COMPANY_ADMIN,
  HR_MANAGER: HR_MANAGER,
  MANAGER: MANAGER,
  EMPLOYEE: EMPLOYEE
};

const ROUTE_PERMISSION: Record<string, string> = {
  '/dashboard': 'dashboard.read',
  '/masters/company': 'company.read',
  '/settings/branding': 'company.update',
  '/master/documents': 'document.read',
  '/masters/users': 'user.read',
  '/masters/document-category': 'document.read',
  '/masters/bank': 'bank.read',
  '/masters/shifts': 'shift.read',
  '/masters/department': 'department.read',
  '/masters/designation': 'designation.read',
  '/masters/holiday': 'holiday.read',
  '/masters/leavetype': 'leavetype.read',
  '/masters/menus': 'permission.manage',
  '/masters/permission-matrix': 'permission.manage',
  '/masters/pages': 'permission.manage',
  '/transactions/employee-shift': 'shift.read',
  '/transactions/document-types': 'document.read',
  '/transactions/master-attendance': 'attendance.read',
  '/transactions/leave-transactions': 'leave.read',
  '/masters/attendance': 'attendance.read',
  '/masters/schedule-master': 'schedule.read',
  '/transactions/schedule-employee': 'schedule.read',
  '/transactions/schedule-transaction': 'schedule.read',
  '/transactions/schedule-email': 'schedule.read',
  '/transactions/yearly-paid': 'payroll.read',
  '/transactions/review': 'review.read',
  '/transactions/review/pending': 'review.read',
  '/transactions/review/history': 'review.read',
  '/recruiter/employee-master': 'employee.read',
  '/recruiter/employee-import': 'employee.create',
  '/recruiter/report': 'employee.read',
  '/payroll/salary': 'payroll.read',
  '/recruiter/payroll': 'payroll.read',
  '/recruiter/payroll-details': 'payroll.read',
  '/recruiter/payroll-adjustment': 'payroll.process',
  '/recruiter/salary-component': 'payroll.read',
  '/recruiter/salary-structure': 'payroll.read',
  '/recruiter/salary-structure-components': 'payroll.read',
  '/recruiter/employee-salary': 'payroll.read',
  '/recruiter/employee-salary-components': 'payroll.read',
  '/recruiter/salary-revisions': 'payroll.read',
  '/subscriptions/plans': 'subscription.read',
  '/subscriptions/my-subscription': 'subscription.read',
  '/admin/revenue': 'platform.billing'
};

const ROUTE_FEATURE: Record<string, string> = {
  '/recruiter/payroll': 'payroll',
  '/recruiter/payroll-details': 'payroll',
  '/recruiter/payroll-adjustment': 'payroll',
  '/payroll/salary': 'payroll',
  '/recruiter/salary-component': 'payroll',
  '/recruiter/salary-structure': 'payroll',
  '/recruiter/salary-structure-components': 'payroll',
  '/recruiter/employee-salary': 'payroll',
  '/recruiter/employee-salary-components': 'payroll',
  '/recruiter/salary-revisions': 'payroll',
  '/transactions/yearly-paid': 'payroll',
  '/master/documents': 'documents',
  '/masters/document-category': 'documents',
  '/transactions/document-types': 'documents',
  '/masters/attendance': 'attendance',
  '/transactions/master-attendance': 'attendance',
  '/transactions/leave-transactions': 'leave',
  '/masters/permission-matrix': 'custom_roles',
  '/masters/pages': 'custom_roles',
  '/masters/menus': 'custom_roles'
};

export function permissionForRoute(url: string): string | null {
  const path = url.split('?')[0].toLowerCase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (ROUTE_PERMISSION[normalized]) {
    return ROUTE_PERMISSION[normalized];
  }
  const match = Object.keys(ROUTE_PERMISSION)
    .sort((a, b) => b.length - a.length)
    .find(route => normalized === route || normalized.startsWith(route + '/'));
  return match ? ROUTE_PERMISSION[match] : null;
}

export function featureForRoute(url: string): string | null {
  const path = url.split('?')[0].toLowerCase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (ROUTE_FEATURE[normalized]) {
    return ROUTE_FEATURE[normalized];
  }
  const match = Object.keys(ROUTE_FEATURE)
    .sort((a, b) => b.length - a.length)
    .find(route => normalized === route || normalized.startsWith(route + '/'));
  return match ? ROUTE_FEATURE[match] : null;
}

export function actionKeyForUrl(url: string, action: 'view' | 'add' | 'edit' | 'delete' | 'approve'): string | null {
  const viewKey = permissionForRoute(url);
  if (!viewKey) {
    return null;
  }
  if (action === 'view') {
    return viewKey;
  }
  const module = viewKey.split('.')[0];
  if (action === 'add') {
    if (module === 'payroll') return 'payroll.process';
    if (module === 'document') return 'document.manage';
    if (module === 'permission') return 'permission.manage';
    if (module === 'user') return 'user.invite';
    if (module === 'company') return 'company.update';
    return `${module}.create`;
  }
  if (action === 'edit') {
    if (module === 'payroll') return 'payroll.process';
    if (module === 'document') return 'document.manage';
    if (module === 'permission') return 'permission.manage';
    if (module === 'user') return 'user.update';
    if (module === 'company') return 'company.update';
    return `${module}.update`;
  }
  if (action === 'delete') {
    if (module === 'user') return 'user.disable';
    if (module === 'payroll') return 'payroll.process';
    return `${module}.delete`;
  }
  if (action === 'approve') {
    if (module === 'leave') return 'leave.approve';
    if (module === 'attendance') return 'attendance.approve';
    return `${module}.approve`;
  }
  return viewKey;
}
