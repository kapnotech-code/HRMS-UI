import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';
import { UiAlertComponent, UiButtonComponent, UiCardComponent, UiPageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, UiCardComponent, UiPageHeaderComponent, UiAlertComponent, UiButtonComponent],
  template: `
    <div class="auth-page">
      <ui-card>
        <ui-page-header title="Email verification" />
        <ui-alert>{{ message }}</ui-alert>
        <a routerLink="/login"><ui-button class="block">Go to login</ui-button></a>
      </ui-card>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--color-bg); }
    ui-card { display: block; width: 100%; max-width: 440px; }
    a { text-decoration: none; }
  `]
})
export class VerifyEmailComponent implements OnInit {
  message = 'Verifying...';

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token) {
      this.message = 'Missing verification token.';
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: (res) => { this.message = res?.message || 'Email verified. You can sign in.'; },
      error: (err) => { this.message = err?.error?.message || 'This link is invalid or has expired.'; }
    });
  }
}
