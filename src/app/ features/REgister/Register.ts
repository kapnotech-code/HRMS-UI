import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../app/core/services/Auth.service';
import { RegisterRequest } from '../../../app/shared/Register/Registerrequest';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Register.html',
  styleUrls: ['./Register.css']
})
export class Register {
  fullName = '';
  loginName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.fullName.trim() || !this.loginName.trim() || !this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    const request: RegisterRequest = {
      fullName: this.fullName.trim(),
      loginName: this.loginName.trim(),
      email: this.email.trim(),
      password: this.password
    };

    this.authService.register(request).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('REGISTER RESPONSE:', res);
        this.successMessage = 'Account created successfully! Redirecting to login...';

        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 1800);
      },
      error: (err) => {
        this.loading = false;
        console.error('REGISTER ERROR:', err);
        this.errorMessage =
          err?.error?.message || err?.error?.Message || 'Registration failed. Please try again.';
      }
    });
  }
}
