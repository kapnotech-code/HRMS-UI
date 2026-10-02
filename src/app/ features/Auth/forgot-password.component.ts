import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';
import { UiAlertComponent, UiButtonComponent, UiCardComponent, UiPageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiCardComponent, UiPageHeaderComponent, UiAlertComponent, UiButtonComponent],
  template: `
    <div class="auth-page">
      <ui-card>
        <ui-page-header title="Forgot password" subtitle="We will email a reset link if the account exists." />
        <ui-alert *ngIf="info" tone="ok">{{ info }}</ui-alert>
        <form (ngSubmit)="submit()" *ngIf="!sent">
          <label>Email
            <input type="email" [(ngModel)]="email" name="email" required />
          </label>
          <ui-button class="block" type="submit" [disabled]="loading">{{ loading ? 'Sending...' : 'Send reset link' }}</ui-button>
        </form>
        <p class="back"><a routerLink="/login">Back to login</a></p>
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
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;
  info = '';

  constructor(private auth: AuthService) {}

  submit(): void {
    this.loading = true;
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        this.sent = true;
        this.info = res?.message || 'If an account exists, a reset link has been sent.';
      },
      error: () => {
        this.loading = false;
        this.sent = true;
        this.info = 'If an account exists, a reset link has been sent.';
      }
    });
  }
}
