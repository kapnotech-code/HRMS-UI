import { describe, expect, it } from 'vitest';
import {
  LOCAL_PERMISSION_MATRIX,
  RoleCodes,
  actionKeyForUrl,
  featureForRoute,
  permissionForRoute,
  roleCodeFromRoleId
} from './permission-matrix';

describe('permission-matrix', () => {
  it('maps RoleId 1 and 6 to COMPANY_ADMIN', () => {
    expect(roleCodeFromRoleId(1)).toBe(RoleCodes.CompanyAdmin);
    expect(roleCodeFromRoleId(6)).toBe(RoleCodes.CompanyAdmin);
    expect(roleCodeFromRoleId(5)).toBe(RoleCodes.SuperAdmin);
    expect(roleCodeFromRoleId(3)).toBe(RoleCodes.Employee);
  });

  it('denies employee payroll and leave approve', () => {
    const emp = LOCAL_PERMISSION_MATRIX.EMPLOYEE;
    expect(emp).toContain('leave.create');
    expect(emp).not.toContain('leave.approve');
    expect(emp).not.toContain('payroll.process');
  });

  it('gives company admin permission.manage and not platform.companies', () => {
    const admin = LOCAL_PERMISSION_MATRIX.COMPANY_ADMIN;
    expect(admin).toContain('permission.manage');
    expect(admin).not.toContain('platform.companies');
  });

  it('maps routes to permission and feature keys', () => {
    expect(permissionForRoute('/recruiter/employee-master')).toBe('employee.read');
    expect(permissionForRoute('recruiter/payroll?x=1')).toBe('payroll.read');
    expect(featureForRoute('/recruiter/payroll-adjustment')).toBe('payroll');
    expect(featureForRoute('/masters/pages')).toBeNull();
    expect(featureForRoute('/dashboard')).toBeNull();
  });

  it('maps UI actions to matrix keys', () => {
    expect(actionKeyForUrl('/recruiter/employee-master', 'add')).toBe('employee.create');
    expect(actionKeyForUrl('/recruiter/payroll', 'add')).toBe('payroll.process');
    expect(actionKeyForUrl('/masters/users', 'delete')).toBe('user.disable');
  });
});
