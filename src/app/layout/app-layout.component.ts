import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../shared/header/header.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { SubscriptionBannerComponent } from '../shared/subscription-banner/subscription-banner.component';
import { FrontendPermissionService } from '../core/services/frontend-permission.service';
import { SubscriptionEntitlementService } from '../core/services/subscription-entitlement.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, SubscriptionBannerComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent implements OnInit {
  constructor(
    private frontendPerm: FrontendPermissionService,
    private entitlement: SubscriptionEntitlementService,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    this.frontendPerm.loadMatrix().subscribe({ error: () => {} });
    this.entitlement.load(true).subscribe();
    this.theme.loadMine().subscribe();
  }
}
