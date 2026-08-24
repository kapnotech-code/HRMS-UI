import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';
import { SidebarService } from '../../core/services/Sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  userName = 'Admin';
  userRole = 'HR Manager';

  constructor(
    private authService: AuthService,
    private router: Router,
    public sidebarService: SidebarService
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
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
      case 1: return 'Admin';
      case 2: return 'HR';
      case 3: return 'Employee';
      default: return `Role-${roleId}`;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
