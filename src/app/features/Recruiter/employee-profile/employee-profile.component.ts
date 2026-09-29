import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../shared/models/employee/employee-response';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-profile.component.html',
  styleUrls: ['./employee-profile.component.css']
})
export class EmployeeProfileComponent implements OnInit {
  employee: EmployeeResponse | null = null;
  loading = true;
  errorMessage = '';
  employeeId: number | null = null;
  today = new Date();

  constructor(
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.employeeId = idParam ? Number(idParam) : null;
    if (this.employeeId) {
      this.loadEmployee();
    } else {
      this.errorMessage = 'Employee ID not provided.';
      this.loading = false;
    }
  }

  loadEmployee(): void {
    this.loading = true;
    this.errorMessage = '';
    this.employeeService.getById(this.employeeId!).subscribe({
      next: (emp: EmployeeResponse) => {
        this.employee = emp;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load employee profile. ' + this.extractError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/Recruiter/Report']);
  }

  getProfilePicUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${window.location.origin}/${path}`;
  }

  isImageUrl(path: string | undefined): boolean {
    if (!path) return false;
    const lower = path.toLowerCase();
    return lower.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/) !== null;
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'active' || s === 'Active') return 'badge-active';
    if (s === 'inactive' || s === 'Inactive') return 'badge-inactive';
    if (s === 'on leave' || s === 'On Leave') return 'badge-leave';
    if (s === 'resigned' || s === 'Resigned') return 'badge-resigned';
    return 'badge-inactive';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getFullName(): string {
    if (!this.employee) return '';
    return `${this.employee.firstName} ${this.employee.lastName}`.trim() || this.employee.employeeName || `Employee #${this.employee.employeeID}`;
  }

  getInitials(): string {
    if (!this.employee) return '?';
    const first = this.employee.firstName?.[0] || '';
    const last = this.employee.lastName?.[0] || '';
    return (first + last).toUpperCase() || this.employee.employeeCode?.[0]?.toUpperCase() || '?';
  }

  private extractError(err: any): string {
    if (err?.error?.title) return err.error.title;
    if (typeof err?.error === 'string') return err.error;
    if (err?.message) return err.message;
    return 'Please check the server connection.';
  }
}
