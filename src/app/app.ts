import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { AuthService } from './core/services/Auth.service';
import { FrontendPermissionService } from './core/services/frontend-permission.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  protected readonly title = signal('hrms-ui');

  showLayout = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private frontendPerm: FrontendPermissionService
  ) {

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: any) => {

        const token = localStorage.getItem('token');
        const currentUrl = event.urlAfterRedirects;

        this.showLayout =
          !!token &&
          currentUrl !== '/login';

        if (this.showLayout) {
          this.loadUserPermissions();
        }
      });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadUserPermissions();
    }
  }

  private loadUserPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) {
      return;
    }

    this.frontendPerm.initialize().subscribe({
      next: () => {
        this.frontendPerm.loadPermissionsForRole(roleId).subscribe({
          next: () => {
            console.log('[App] Permissions loaded for role:', roleId);
          },
          error: (err) => {
            console.error('[App] Failed to load permissions:', err);
          }
        });
      },
      error: () => {
        console.error('[App] Failed to initialize pages');
      }
    });
  }
}
