import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { UserRequest } from '../../../shared/models/User/UserRequest';
import { FrontendPermissionService } from '../../../core/services/frontend-permission.service';
import { Role } from '../../../shared/models/Role/Role';
import { DepartmentService } from '../../../core/services/Department.Service';
import { DepartmentResponse } from '../../../shared/models/DepartmentResponse/DepartmentResponse';
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  loading = false;
  saving = false;
  errorMsg = '';
  permissionDenied = false;

  // Shown under the Departments field when the list cannot be loaded
  departmentsError = '';

  // Roles master API alag se ho to yahan service call se replace kar lena
  roles: Role[] = [
    { roleId: 1, roleName: 'Admin' },
    { roleId: 2, roleName: 'HR' },
    { roleId: 3, roleName: 'Employee' }
  ];

  departments: DepartmentResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private frontendPerm: FrontendPermissionService,
    private departmentService: DepartmentService
  ) { }

  private checkPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    if (!this.isEditMode && !this.frontendPerm.canAddByUrl('/masters/users')) {
      this.permissionDenied = true;
      this.errorMsg = 'You do not have permission to add users.';
      this.router.navigate(['/masters/users']);
      return;
    }
    if (this.isEditMode && !this.frontendPerm.canEditByUrl('/masters/users')) {
      this.permissionDenied = true;
      this.errorMsg = 'You do not have permission to edit users.';
      this.router.navigate(['/masters/users']);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.userId = id ? Number(id) : null;
    this.isEditMode = this.userId !== null;
    this.checkPermissions();
    if (this.permissionDenied) return;

    this.loadDepartments();

    this.form = this.fb.group({
      userName: ['', [Validators.required, Validators.maxLength(100)]],
      loginUserId: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]],
      roleId: [null, [Validators.required]],
      deviceId: [''],
      // FIX: the label says "Departments *" but nothing enforced it.
      // Validators.required treats an empty array as empty.
      departmentIds: [[], [Validators.required]]
    });

    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  loadDepartments(): void {
    this.departmentsError = '';
    this.departmentService.getAll().subscribe({
      next: (depts) => {
        // Kept while you debug: check the field names of one item here
        // (the template reads departmentID and departmentName).
        console.log('Departments loaded:', depts);
        this.departments = depts || [];
        if (this.departments.length === 0) {
          this.departmentsError = 'No departments were returned.';
        }
      },
      error: (err) => {
        console.error('Failed to load departments:', err);
        this.departments = [];
        this.departmentsError = 'Unable to load departments.';
      }
    });
  }

  onDepartmentChange(deptId: number, event: Event): void {
    const control = this.form.get('departmentIds');
    if (!control) return;

    const checked = (event.target as HTMLInputElement).checked;
    const currentIds: number[] = control.value || [];

    if (checked) {
      // avoid adding the same id twice
      if (!currentIds.includes(deptId)) {
        control.setValue([...currentIds, deptId]);
      }
    } else {
      control.setValue(currentIds.filter((id: number) => id !== deptId));
    }
    control.markAsTouched();
  }

  loadUser(id: number): void {
    this.loading = true;
    this.userService.getById(id).subscribe({
      next: (user) => {
        // Backend returns departmentIds as comma-separated string, convert to array for form
        const deptIdsStr = (user as any).departmentIds;
        const deptIdsArr = deptIdsStr ? String(deptIdsStr).split(',').map(Number).filter(n => !isNaN(n)) : [];

        this.form.patchValue({
          userName: user.userName,
          loginUserId: user.loginName,
          email: user.email,
          roleId: user.roleId,
          deviceId: user.deviceId,
          departmentIds: deptIdsArr
        });
        // Edit mode mein password field hata dete hain (reset alag flow se)
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Unable to load user.';
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMsg = '';

    // Convert departmentIds array to comma-separated string for backend
    const deptIds = this.form.get('departmentIds')?.value || [];
    const payload: UserRequest = {
      ...this.form.value,
      departmentIds: Array.isArray(deptIds) ? deptIds.join(',') : deptIds
    };

    if (this.isEditMode && this.userId !== null) {
      this.userService.update(this.userId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/masters/users']);
        },
error: (err) => {
            console.error('Update error:', err);
            console.error('Update error response:', err?.error);
            console.error('Update payload sent:', payload);
            this.saving = false;
            this.errorMsg = err?.error?.message || 'Update failed.';
          }
      });
    } else {
      this.userService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/masters/users']);
        },
error: (err) => {
            console.error('Create error:', err);
            console.error('Create error response:', err?.error);
            console.error('Create payload sent:', payload);
            this.saving = false;
            this.errorMsg = err?.error?.message || 'Save failed.';
          }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/masters/users']);
  }
}
