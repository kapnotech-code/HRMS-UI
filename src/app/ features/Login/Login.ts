import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';
import { SidebarService } from '../../core/services/Sidebar.service';
import { SubscriptionEntitlementService } from '../../core/services/subscription-entitlement.service';
import { LoginRequest, TenantChoice } from '../../shared/models/Login/LoginRequest';
import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';
import { UiAlertComponent, UiButtonComponent } from '../../shared/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiAlertComponent, UiButtonComponent],
  templateUrl: './Login.html',
  styleUrls: ['./Login.css']
})
export class Login implements OnInit {
  loginName = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  companySlug = '';
  companyId?: number;
  tenantName = '';
  tenantLogo = '';
  tenantMissing = false;
  companies: TenantChoice[] = [];

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router,
    private route: ActivatedRoute,
    private entitlement: SubscriptionEntitlementService,
    private theme: ThemeService
  ) { }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.loginName = email;
    }

    this.route.paramMap.subscribe(params => {
      const slug = (params.get('slug') || '').trim().toLowerCase();
      this.companySlug = slug;
      this.tenantMissing = false;
      this.tenantName = '';
      this.tenantLogo = '';
      if (!slug) {
        return;
      }
      this.authService.getTenant(slug).subscribe({
        next: (res) => {
          const data = res?.data ?? res?.Data;
          this.tenantName = data?.companyName || data?.CompanyName || '';
          this.tenantLogo = this.assetUrl(data?.logoUrl || data?.LogoUrl);
          this.companyId = data?.companyId ?? data?.CompanyId;
          this.theme.loadPublic(slug).subscribe();
        },
        error: () => {
          this.tenantMissing = true;
          this.errorMessage = 'This company workspace was not found.';
        }
      });
    });
  }

  pickCompany(choice: TenantChoice): void {
    this.companyId = choice.companyId;
    this.companySlug = choice.slug;
    this.tenantName = choice.companyName;
    this.tenantLogo = this.assetUrl(choice.logoUrl);
    this.companies = [];
    this.submit();
  }

  submit(): void {
    this.errorMessage = '';

    if (this.tenantMissing) {
      this.errorMessage = 'This company workspace was not found.';
      return;
    }

    if (!this.loginName.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter your Login ID and Password.';
      return;
    }

    this.loading = true;

    const request: LoginRequest = {
      userId: this.loginName.trim(),
      loginName: this.loginName.trim(),
      password: this.password,
      deviceId: 'WEB',
      companySlug: this.companySlug || undefined,
      companyId: this.companyId
    };

    this.authService.login(request).subscribe({
      next: (res: any) => {
        this.loading = false;
        const token =
          res?.data?.token || res?.data?.Token ||
          res?.token || res?.Token ||
          res?.accessToken || res?.AccessToken;

        if (token && res?.data) {
          this.authService.persistLogin(res.data);
          this.sidebarService.open();
          this.theme.loadMine().subscribe();
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
          const landing = res.data.landingPath || res.data.LandingPath || '/dashboard';
          this.entitlement.clearCache();
          this.entitlement.load(true).subscribe(e => {
            const pending = (e?.status || '').toLowerCase() === 'pending';
            if (returnUrl) {
              this.router.navigateByUrl(returnUrl);
            } else if (pending) {
              this.router.navigateByUrl('/subscriptions/plans');
            } else {
              this.router.navigateByUrl(landing);
            }
          });
        } else {
          this.errorMessage = res?.message || res?.Message || 'Login failed. Please try again.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        const code = err?.error?.code;
        if (code === 'PICK_COMPANY') {
          this.companies = this.normalizeCompanies(err?.error?.data);
          this.errorMessage = err?.error?.message || 'Choose a company to continue.';
          return;
        }
        const map: Record<string, string> = {
          USER_DISABLED: 'This account has been disabled.',
          COMPANY_SUSPENDED: 'This company has been suspended.',
          SUBSCRIPTION_EXPIRED: 'This company subscription is not active.',
          EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
          UNKNOWN_TENANT: 'This company workspace was not found.'
        };
        this.errorMessage =
          map[code] ||
          err?.error?.message ||
          err?.error?.Message ||
          'Invalid email or password.';
      }
    });
  }

  private normalizeCompanies(raw: any): TenantChoice[] {
    const list = Array.isArray(raw) ? raw : [];
    return list.map((item: any) => ({
      companyId: item.companyId ?? item.CompanyId,
      companyName: item.companyName ?? item.CompanyName ?? 'Company',
      slug: item.slug ?? item.Slug ?? '',
      logoUrl: item.logoUrl ?? item.LogoUrl
    }));
  }

  assetUrl(path: string | null | undefined): string {
    if (!path) {
      return '';
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const origin = environment.apiUrl.replace(/\/api\/?$/, '');
    return origin + (path.startsWith('/') ? path : `/${path}`);
  }
}
