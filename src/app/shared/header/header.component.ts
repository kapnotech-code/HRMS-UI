import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';
import { SidebarService } from '../../core/services/Sidebar.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  userName = 'Admin';
  userRole = 'HR Manager';
  brandName = 'HRMS';
  brandLogo = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public sidebarService: SidebarService,
    public theme: ThemeService
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
    this.theme.branding$.subscribe(b => {
      this.brandName = b.displayName || 'HRMS';
      this.brandLogo = this.theme.assetUrl(b.logoUrl);
    });
  }

  private loadUserInfo(): void {
    try {
      const token = this.authService.getToken();
      if (!token) return;

      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userName = payload.userName || payload.UserName || payload.sub || payload.unique_name || payload.name || 'User';
      
      const rawRoleId = payload.roleId ?? payload.RoleId;
      const roleId = typeof rawRoleId === 'string' ? Number(rawRoleId) : rawRoleId;
      if (roleId) {
        this.userRole = this.getRoleName(roleId);
      } else {
        this.userRole = 'User';
      }
    } catch {
      // keep defaults
    }
  }

  private getRoleName(roleId: number): string {
    switch (roleId) {
      case 1:
      case 6:
        return 'Company Admin';
      case 2: return 'HR';
      case 3: return 'Employee';
      case 4: return 'Manager';
      case 5: return 'Super Admin';
      default: return `Role-${roleId}`;
    }
  }

  logout(): void {
    this.authService.logout();
    this.theme.reset();
    this.router.navigate(['/login']);
  }
}
