import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';
import { UiAlertComponent, UiButtonComponent, UiCardComponent, UiPageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiCardComponent, UiPageHeaderComponent, UiAlertComponent, UiButtonComponent],
  template: `
    <div class="auth-page">
      <ui-card>
        <ui-page-header title="Accept invite" subtitle="Create your login for this workspace." />
        <ui-alert *ngIf="message" [tone]="done ? 'ok' : 'danger'">{{ message }}</ui-alert>
        <form (ngSubmit)="submit()" *ngIf="!done">
          <label>Full name
            <input [(ngModel)]="fullName" name="fullName" required />
          </label>
          <label>Login ID
            <input [(ngModel)]="loginName" name="loginName" required />
          </label>
          <label>Password
            <input type="password" [(ngModel)]="password" name="password" required minlength="8" />
          </label>
          <ui-button class="block" type="submit" [disabled]="loading">{{ loading ? 'Creating...' : 'Create account' }}</ui-button>
        </form>
        <p class="back"><a routerLink="/login">Go to login</a></p>
      </ui-card>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }
    ui-card { display: block; width: 100%; max-width: 440px; }
    label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; margin-bottom: 14px; }
    input { border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 12px; font: inherit; }
    .back { margin: 16px 0 0; }
    a { color: var(--color-primary-dark); }
  `]
})
export class SetPasswordComponent {
  fullName = '';
  loginName = '';
  password = '';
  loading = false;
  done = false;
  message = '';

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  submit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    this.loading = true;
    this.auth.acceptInvite({
      token,
      fullName: this.fullName.trim(),
      loginName: this.loginName.trim(),
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.done = true;
        this.message = res?.message || 'Account created.';
      },
      error: (err) => {
        this.loading = false;
        this.message = err?.error?.message || 'This invite is invalid or has expired.';
      }
    });
  }
}
