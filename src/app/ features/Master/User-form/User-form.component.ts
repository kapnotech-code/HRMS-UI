import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { UserRequest } from '../../../shared/models/User/UserRequest';
import { Role } from '../../../shared/models/Role/Role';
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

  // Roles master API alag se ho to yahan service call se replace kar lena
  roles: Role[] = [
    { roleId: 1, roleName: 'Admin' },
    { roleId: 2, roleName: 'HR' },
    { roleId: 3, roleName: 'Employee' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.userId = id ? Number(id) : null;
    this.isEditMode = this.userId !== null;
    this.form = this.fb.group({
      userName: ['', [Validators.required, Validators.maxLength(100)]],
      loginUserId: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]],
      roleId: [null, [Validators.required]],
      deviceId: ['']
    });

    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  loadUser(id: number): void {
    this.loading = true;
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.form.patchValue({
          userName: user.userName,
          loginUserId: user.loginName,
          email: user.email,
          roleId: user.roleId,
          deviceId: user.deviceId
        });
        // Edit mode mein password field hata dete hain (reset alag flow se)
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'User load nahi ho paya.';
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

    const payload: UserRequest = this.form.value;

    if (this.isEditMode && this.userId !== null) {
      this.userService.update(this.userId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.saving = false;
          this.errorMsg = err?.error?.message || 'Update nahi ho paya.';
        }
      });
    } else {
      this.userService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.saving = false;
          this.errorMsg = err?.error?.message || 'Save nahi ho paya.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
