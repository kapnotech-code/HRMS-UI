import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../app/core/services/Auth.service';
import { LoginRequest } from '../../../app/shared/models/Login/LoginRequest';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Login.html',
  styleUrls: ['./Login.css']
})
export class Login {
  loginName = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  submit(): void {
    this.errorMessage = '';

    if (!this.loginName.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter your Login Id and Password.';
      return;
    }

    this.loading = true;

    const request: LoginRequest = {
      userId: this.loginName.trim(),
      loginName: this.loginName.trim(),
      password: this.password,
      deviceId: 'WEB'
    };

    this.authService.login(request).subscribe({
      next: (res: any) => {
        this.loading = false;

        // Poora response dekho console mein — isse exact shape confirm hogi
        console.log('LOGIN RESPONSE:', res);

        // Token ko har common jagah se dhoondo (backend jo bhi format bheje)
        const token =
          res?.token ||
          res?.Token ||
          res?.accessToken ||
          res?.AccessToken ||
          res?.data?.token ||
          res?.data?.Token ||
          res?.result?.token;

        if (token) {
          this.authService.saveToken(token);
          console.log('TOKEN SAVED:', localStorage.getItem('token'));

          this.router.navigateByUrl('/dashboard').then(success => {
            if (!success) {
              console.error('Navigation blocked — check authGuard / isLoggedIn().');
              this.errorMessage = 'Login hua, lekin dashboard open nahi ho paya.';
            }
          });
        } else {
          // Token nahi mila — backend ne message/error bheja hoga
          console.warn('No token found in response. Check field name above.');
          this.errorMessage =
            res?.message || res?.Message || 'Login failed. Token not received.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('LOGIN ERROR:', err);
        this.errorMessage =
          err?.error?.message || err?.error?.Message || 'Invalid login id or password.';
      }
    });
  }
}
