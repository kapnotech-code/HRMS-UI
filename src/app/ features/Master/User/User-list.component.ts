import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../shared/models/User/userresponse';
import { Role } from '../../../shared/models/Role/Role';
import { UserRequest } from '../../../shared/models/User/UserRequest';

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
  errorMsg = '';

  // Modal state
  showModal = false;
  isEditMode = false;
  editingUserId: number | null = null;
  form!: FormGroup;
  saving = false;
  formError = '';

  // Replace with a roles master API if available
  roles: Role[] = [
    { roleId: 1, roleName: 'Admin' },
    { roleId: 2, roleName: 'HR' },
    { roleId: 3, roleName: 'Employee' }
  ];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.loadUsers();
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
        this.errorMsg = 'Failed to load users. Please check the backend.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.loadUsers();
  }

  // ---- Helpers ----

  getRoleName(roleId: number): string {
    return this.roles.find(r => r.roleId === roleId)?.roleName || '-';
  }

  // Resolves the login name for both the table and the edit modal —
  // the backend sometimes sends the value under `loginUserId`, sometimes under `loginName`.
  getLoginName(user: UserResponse): string {
    return user.loginUserId || user.loginName || '-';
  }

  // ---- Modal open/close ----

  openAddModal(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.formError = '';
    this.buildForm();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(user: UserResponse): void {
    this.isEditMode = true;
    this.editingUserId = user.userId;
    this.formError = '';
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

    if (this.isEditMode && this.editingUserId !== null) {
      this.userService.update(this.editingUserId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error(err);
          this.saving = false;
          this.formError = err?.error?.message || 'Update failed. Please try again.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.userService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error(err);
          this.saving = false;
          this.formError = err?.error?.message || 'Save failed. Please try again.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ---- Row actions ----

  toggleActive(user: UserResponse, isActive: boolean): void {
    this.userService.setActive(user.userId, isActive).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMsg = 'Failed to update status.';
        this.cdr.detectChanges();
      }
    });
  }

  unlockUser(user: UserResponse): void {
    if (!confirm(`Unlock ${user.userName}?`)) return;
    this.userService.unlock(user.userId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMsg = 'Failed to unlock user.';
        this.cdr.detectChanges();
      }
    });
  }
}
