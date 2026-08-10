import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/Auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [/* apne existing imports */],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  userName = 'Admin';
  userRole = 'HR manager';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
