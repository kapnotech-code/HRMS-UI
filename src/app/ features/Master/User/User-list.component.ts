import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../shared/models/User/userresponse';
import { Role } from '../../../shared/models/Role/Role';
import { UserRequest } from '../../../shared/models/User/UserRequest';
import { FrontendPermissionService } from '../../../core/services/frontend-permission.service';

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
  // Kept separate so success (green) and error (red) never collide in the same message.
  errorMsg = '';
  successMsg = '';

  // Modal state
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;
  form!: FormGroup;
  saving = false;
  formError = '';

  // Delete state (per-row loading indicator, same pattern as other list components)
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

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private frontendPerm: FrontendPermissionService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadPermissions();
  }

  buildForm(): void {
    this.form = this.fb.group({
      userName: ['', [Validators.required, Validators.maxLength(100)]],
      loginUserId: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      roleId: [null, [Validators.required]],
      deviceId: ['']
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMsg = '';
    this.userService.getAll(this.searchTerm || undefined).subscribe({
      next: (data: UserResponse[]) => {
        this.users = data || [];
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

  // ---- Helpers ----

  getRoleName(roleId: number): string {
    return this.roles.find(r => r.roleId === roleId)?.roleName || '-';
  }

  getLoginName(user: UserResponse): string {
    return user.loginUserId || user.loginName || '-';
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

    // Use whichever field actually has a value, so the input doesn't appear empty
    const resolvedLoginName = this.getLoginName(user);

    this.form.patchValue({
      userName: user.userName,
      loginUserId: resolvedLoginName !== '-' ? resolvedLoginName : '',
      email: user.email,
      roleId: user.roleId,
      deviceId: user.deviceId
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

    const payload: UserRequest = { ...this.form.value };

    // In edit mode the password field isn't shown in the UI, but the form control
    // still exists with an empty value — sending an empty password fails
    // [Required] validation on the backend, so remove it.
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
          console.error(err);
          this.saving = false;
          // Show the backend's exact reason (validation error, "User not found", etc.)
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
          console.error(err);
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
    const confirmed = confirm(`Delete user "${user.userName}"? This action cannot be undone.`);
    if (!confirmed) return;

    this.clearAlerts();
    this.deletingId = user.userId;
    this.cdr.detectChanges();

    this.userService.delete(user.userId).subscribe({
      next: (res: any) => {
        console.log(res);
        this.deletingId = null;
        this.successMsg = res?.message || `User "${user.userName}" deleted successfully.`;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.deletingId = null;
        // Show the exact backend reason (e.g. "User not found", FK constraint error, etc.)
        this.errorMsg = err?.error?.message
          || `Failed to delete "${user.userName}  first delete from user roles" (HTTP ${err?.status ?? 'unknown'}).`;
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
