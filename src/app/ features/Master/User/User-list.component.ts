import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../shared/models/User/userresponse';
import { Role } from '../../../shared/models/Role/Role';
import { UserRequest } from '../../../shared/models/User/UserRequest';
import { FrontendPermissionService } from '../../../core/services/frontend-permission.service';
import { DepartmentService } from '../../../core/services/Department.Service';
import { DepartmentResponse } from '../../../shared/models/DepartmentResponse/DepartmentResponse';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './User-list.component.html',
  styleUrls: ['./User-list.component.css']
})
export class UserListComponent implements OnInit {
  users: UserResponse[] = [];
  searchTerm = '';
  loading = false;

  // ---- Page-level alerts (shown above the table) ----
  errorMsg = '';
  successMsg = '';

  // Modal state
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;
  form!: FormGroup;
  saving = false;
  formError = '';

  // Delete state (per-row loading indicator)
  deletingId: number | null = null;

  // Permission flags (admin bypass)
  canAdd = true;
  canEdit = true;
  canDelete = true;

  // Replace with a roles master API if available
  roles: Role[] = [
    { roleId: 1, roleName: 'Admin' },
    { roleId: 2, roleName: 'HR' },
    { roleId: 3, roleName: 'Employee' }
  ];

  departments: DepartmentResponse[] = [];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private frontendPerm: FrontendPermissionService,
    private departmentService: DepartmentService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadPermissions();
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (depts) => {
        console.log('Departments loaded:', depts);
        this.departments = depts || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load departments:', err);
        this.departments = [];
      }
    });
  }

  onDepartmentChange(deptId: number, event: Event): void {
    const control = this.form.get('departmentIds');
    if (!control) return;

    const checked = (event.target as HTMLInputElement).checked;
    const currentIds: number[] = control.value || [];

    if (checked) {
      if (!currentIds.includes(deptId)) {
        control.setValue([...currentIds, deptId]);
      }
    } else {
      control.setValue(currentIds.filter((id: number) => id !== deptId));
    }
    control.markAsTouched();
  }

  buildForm(): void {
    this.form = this.fb.group({
      userName: ['', [Validators.required, Validators.maxLength(100)]],
      loginUserId: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      roleId: [null, [Validators.required]],
      deviceId: [''],
      departmentIds: [[]]
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMsg = '';
    this.userService.getAll(this.searchTerm || undefined).subscribe({
      next: (data: UserResponse[]) => {
        console.log('Users loaded:', data);
        if (data.length > 0) {
          const firstUser = data[0];
          console.log('First user keys:', Object.keys(firstUser));
          console.log('First user departmentIds:', firstUser.departmentIds);
          console.log('First user departmentNames:', firstUser.departmentNames);
          console.log('All user fields:', JSON.stringify(firstUser, null, 2));
        }

        this.users = Array.isArray(data) ? data.filter(u => !!u) : [];

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMsg = err?.error?.message || 'Failed to load users. Please check the backend.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    this.canAdd = this.frontendPerm.canAddByUrl('/masters/users');
    this.canEdit = this.frontendPerm.canEditByUrl('/masters/users');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/masters/users');
    this.cdr.detectChanges();
  }

  onSearchChange(): void {
    this.loadUsers();
  }

  // ---- Safe display helpers (none of these may throw) ----

  /** Accepts an array, a comma separated string, a single value or nothing. */
  private toArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === '') return [];
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(s => s !== '');
    }
    return [value];
  }

  // FIX: departmentIds / departmentNames can arrive as a string, a number
  // or null. Calling .map() on a non-array threw a TypeError, which stopped
  // the rest of that table row from rendering.
  getDepartmentNames(user: UserResponse): string[] {
    try {
      const names = this.toArray((user as any)?.departmentNames)
        .map(n => String(n).trim())
        .filter(n => n !== '');
      if (names.length > 0) return names;

      const ids = this.toArray((user as any)?.departmentIds)
        .map(id => Number(id))
        .filter(id => !Number.isNaN(id));

      return ids
        .map(id => this.departments.find(d => Number(d.departmentID) === id)?.departmentName)
        .filter((name: string | undefined): name is string => !!name);
    } catch {
      return [];
    }
  }

  getRoleName(roleId: number): string {
    return this.roles.find(r => r.roleId === Number(roleId))?.roleName || '-';
  }

  getLoginName(user: UserResponse): string {
    return user?.loginUserId || user?.loginName || '-';
  }

  // FIX: replaces the `date` pipe in the template, which throws on an
  // invalid date string and breaks the whole row.
  formatCreated(value: any): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-');
  }

  getFailedCount(user: UserResponse): number {
    const n = Number(user?.failedLoginCount);
    return Number.isNaN(n) ? 0 : n;
  }

  // FIX: `deletingId === user.userId` was TRUE when both were null, which
  // disabled the Delete button and showed "Deleting..." on a row that was
  // not being deleted.
  isDeleting(user: UserResponse): boolean {
    return this.deletingId !== null && this.deletingId === user?.userId;
  }

  private clearAlerts(): void {
    this.errorMsg = '';
    this.successMsg = '';
  }

  // ---- Modal open/close ----

  openAddModal(): void {
    if (!this.canAdd) return;
    this.isEditMode = false;
    this.editingUserId = null;
    this.formError = '';
    this.clearAlerts();
    this.buildForm();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(user: UserResponse): void {
    if (!this.canEdit) return;
    this.isEditMode = true;
    this.editingUserId = user.userId;
    this.formError = '';
    this.clearAlerts();
    this.buildForm();
    // Password is not required in edit mode
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();

    const resolvedLoginName = this.getLoginName(user);

    this.form.patchValue({
      userName: user.userName,
      loginUserId: resolvedLoginName !== '-' ? resolvedLoginName : '',
      email: user.email,
      roleId: user.roleId,
      deviceId: user.deviceId,
      departmentIds: this.toArray((user as any).departmentIds)
        .map(id => Number(id))
        .filter(id => !Number.isNaN(id))
    });
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  // ---- Save (create/update) ----

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please fix the highlighted fields before saving.';
      return;
    }

    this.saving = true;
    this.formError = '';

    // Convert departmentIds array to comma-separated string for backend
    const deptIds = this.form.get('departmentIds')?.value || [];
    const payload: UserRequest = {
      ...this.form.value,
      departmentIds: Array.isArray(deptIds) ? deptIds.join(',') : deptIds
    };

    // In edit mode the password field isn't shown, so drop the empty value.
    if (this.isEditMode && !payload.password) {
      delete (payload as any).password;
    }

    const userNameForMsg = payload.userName;

    if (this.isEditMode && this.editingUserId !== null) {
      this.userService.update(this.editingUserId, payload).subscribe({
        next: (res: any) => {
          this.saving = false;
          this.showModal = false;
          this.clearAlerts();
          this.successMsg = res?.message || `User "${userNameForMsg}" updated successfully.`;
          this.loadUsers();
          this.cdr.detectChanges();
        },
error: (err: any) => {
            console.error('Update error:', err);
            console.error('Update error response:', err?.error);
            console.error('Update payload sent:', payload);
            this.saving = false;
            this.formError = err?.error?.message
              || err?.error?.errors?.[Object.keys(err?.error?.errors || {})[0]]?.[0]
              || `Update failed (HTTP ${err?.status ?? 'unknown'}). Please check the details and try again.`;
            this.cdr.detectChanges();
          }
      });
    } else {
      this.userService.create(payload).subscribe({
        next: (res: any) => {
          this.saving = false;
          this.showModal = false;
          this.clearAlerts();
          this.successMsg = res?.message || `User "${userNameForMsg}" created successfully.`;
          this.loadUsers();
          this.cdr.detectChanges();
        },
error: (err: any) => {
            console.error('Create error:', err);
            console.error('Create error response:', err?.error);
            console.error('Create payload sent:', payload);
            this.saving = false;
            this.formError = err?.error?.message
              || err?.error?.errors?.[Object.keys(err?.error?.errors || {})[0]]?.[0]
              || `Save failed (HTTP ${err?.status ?? 'unknown'}). Please check the details and try again.`;
            this.cdr.detectChanges();
          }
      });
    }
  }

  // ---- Delete ----

  deleteUser(user: UserResponse): void {
    if (!this.canDelete) return;

    if (user?.userId === null || user?.userId === undefined) {
      this.errorMsg = 'This row has no user id, so it cannot be deleted from here.';
      this.cdr.detectChanges();
      return;
    }

    const confirmed = confirm(`Delete user "${user.userName}"? This action cannot be undone.`);
    if (!confirmed) return;

    this.clearAlerts();
    this.deletingId = user.userId;
    this.cdr.detectChanges();

    this.userService.delete(user.userId).subscribe({
      next: (res: any) => {
        this.deletingId = null;
        this.successMsg = res?.message || `User "${user.userName}" deleted successfully.`;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.deletingId = null;

        // Show the backend's reason; if there is none, explain the likely cause.
        const apiMsg = err?.error?.message;
        this.errorMsg = apiMsg
          ? `Failed to delete "${user.userName}": ${apiMsg}`
          : `Failed to delete "${user.userName}" (HTTP ${err?.status ?? 'unknown'}). `
            + 'The user may still be linked to roles or departments; those links must be removed first.';
        this.cdr.detectChanges();
      }
    });
  }

  // ---- Row actions ----

  toggleActive(user: UserResponse, isActive: boolean): void {
    this.clearAlerts();
    this.userService.setActive(user.userId, isActive).subscribe({
      next: (res: any) => {
        this.successMsg = res?.message
          || `User "${user.userName}" marked as ${isActive ? 'active' : 'inactive'}.`;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMsg = err?.error?.message
          || `Failed to update status for "${user.userName}" (HTTP ${err?.status ?? 'unknown'}).`;
        this.cdr.detectChanges();
      }
    });
  }

  unlockUser(user: UserResponse): void {
    if (!confirm(`Unlock ${user.userName}?`)) return;
    this.clearAlerts();
    this.userService.unlock(user.userId).subscribe({
      next: (res: any) => {
        this.successMsg = res?.message || `User "${user.userName}" unlocked successfully.`;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMsg = err?.error?.message
          || `Failed to unlock "${user.userName}" (HTTP ${err?.status ?? 'unknown'}).`;
        this.cdr.detectChanges();
      }
    });
  }
}
