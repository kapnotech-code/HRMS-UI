import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';
import { CompanyRequest } from '../../../shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../../shared/models/companylist/CompanyResponse';
import { ApiResponse } from '../../../shared/models/api-response';
import { EmployeeService } from '../../../core/services/employee.service';
import { AttendanceResponse } from '../../../shared/models/Attendance/AttendanceRequest/attendanceRequest';
import { EmployerService } from '../../../core/services/company.service';
import { EmployeeResponse } from '../../../shared/models/employee/employee-response';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './AttendancesList.html',
  styleUrls: ['./AttendancesList.css']
})
export class AttendancesLists implements OnInit {
  attendanceRecords: AttendanceResponse[] = [];
  filteredAttendance: AttendanceResponse[] = [];
  companies: CompanyResponse[] = [];
  employees: EmployeeResponse[] = [];

  loading = true;
  errorMessage = '';
  saving = false;
  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // filters
  filterEmployeeID: number | null = null;
  filterDate = '';

  // form fields
  formEmployeeID: number | null = null;
  formCompanyID: number | null = null;
  formAttendanceDate = '';
  formCheckInTime = '';
  formCheckOutTime = '';
  formStatus = 'Present';
  formRemarks = '';
  formSource = 'Manual';

  statusOptions = ['Present', 'Absent', 'HalfDay', 'Holiday'];

  constructor(
    private attendanceService: AttendanceService,
    private employerService: EmployerService,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadEmployees();
    this.loadData();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.resetForm();
        this.isEditMode = false;
        this.showForm = true;
      } else if (params['action'] === 'edit' && params['id']) {
        const item = this.attendanceRecords.find(a => a.attendanceID === +params['id']);
        if (item) {
          this.isEditMode = true;
          this.currentId = item.attendanceID;
          this.formEmployeeID = item.employeeID;
          this.formCompanyID = item.companyID;
          this.formAttendanceDate = item.attendanceDate?.substring(0, 10) ?? '';
          this.formCheckInTime = this.extractTime(item.checkInTime);
          this.formCheckOutTime = this.extractTime(item.checkOutTime);
          this.formStatus = item.status;
          this.formRemarks = item.remarks ?? '';
          this.formSource = item.source;
          this.showForm = true;
        }
      } else {
        this.showForm = false;
      }
      this.cdr.detectChanges();
    });
  }

  loadData(): void {
    this.loading = true;
    this.attendanceService.getAll().subscribe({
      next: (res) => {
        this.attendanceRecords = res || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Failed to load attendance records. Please check the backend.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCompanies(): void {
    this.employerService.getAllForDropdown().subscribe({
      next: (res) => {
        this.companies = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load companies:', err)
    });
  }

  loadEmployees(): void {
    // ⚠️ Was calling employeeService.getAllForDropdown(), but that endpoint
    // doesn't exist on the backend (EmployeeController only has GetAll,
    // GetById, Add, Update, Delete) — it returned 405 Method Not Allowed,
    // so `employees` stayed empty and no names ever showed up.
    // Using the existing, working GetAll endpoint instead.
    this.employeeService.getAll().subscribe({
      next: (res) => {
        this.employees = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load employees:', err)
    });
  }

  getCompanyName(companyID: number | null | undefined): string {
    if (!companyID) return '-';
    const company: any = this.companies.find((c: any) => c.companyID === companyID);
    return company ? (company.companyName ?? '-') : '-';
  }

  getEmployeeName(employeeID: number | null | undefined): string {
    if (!employeeID) return '-';
    const emp: any = this.employees.find((e: any) => e.employeeID === employeeID);
    return emp ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() : '-';
  }

  applyFilter(): void {
    this.filteredAttendance = this.attendanceRecords.filter(a => {
      const employeeMatch = !this.filterEmployeeID || a.employeeID === this.filterEmployeeID;
      const dateMatch = !this.filterDate || a.attendanceDate?.substring(0, 10) === this.filterDate;
      return employeeMatch && dateMatch;
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterEmployeeID = null;
    this.filterDate = '';
    this.filteredAttendance = this.attendanceRecords;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.currentId = null;
    this.formEmployeeID = null;
    this.formCompanyID = null;
    this.formAttendanceDate = '';
    this.formCheckInTime = '';
    this.formCheckOutTime = '';
    this.formStatus = 'Present';
    this.formRemarks = '';
    this.formSource = 'Manual';
  }

  openAddForm(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'add' },
      queryParamsHandling: 'merge'
    });
  }

  openEditForm(item: AttendanceResponse): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'edit', id: item.attendanceID },
      queryParamsHandling: 'merge'
    });
  }

  deleteItem(item: AttendanceResponse): void {
    if (!confirm('Do you want to delete this attendance record?')) return;

    this.attendanceService.delete(item.attendanceID, true).subscribe({
      next: () => {
        alert('Attendance record deleted successfully.');
        this.loadData();
      },
      error: (err: any) => {
        console.error(err);
        const msg = err?.error?.message || 'Delete failed. Please try again.';
        alert(msg);
      }
    });
  }
  closeForm(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null, id: null },
      queryParamsHandling: 'merge'
    });
  }

  private extractTime(value: string | null | undefined): string {
    if (!value) return '';
    const match = value.match(/T?(\d{2}:\d{2})/);
    return match ? match[1] : '';
  }

  private combineDateTime(date: string, time: string): string | null {
    if (!date || !time) return null;
    // time from <input type="time"> is "HH:mm" (sometimes "HH:mm:ss")
    const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
    return `${date}T${timeWithSeconds}`;
  }
  saveAttendance(): void {
    if (!this.formEmployeeID) {
      alert('Employee select karna zaroori hai');
      return;
    }

    if (!this.formCompanyID) {
      alert('Please select a company.');
      return;
    }

    if (!this.formAttendanceDate) {
      alert('Please select an attendance date.');
      return;
    }

    const payload = {
      employeeID: this.formEmployeeID,
      companyID: this.formCompanyID,
      attendanceDate: this.formAttendanceDate,
      checkInTime: this.combineDateTime(this.formAttendanceDate, this.formCheckInTime),
      checkOutTime: this.combineDateTime(this.formAttendanceDate, this.formCheckOutTime),
      status: this.formStatus,
      remarks: this.formRemarks || null,
      source: this.formSource
    };

    this.saving = true;

    if (this.isEditMode && this.currentId) {
      this.attendanceService.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Attendance updated successfully.');
          this.closeForm();
          this.loadData();
        },
        error: (err: any) => {
          this.saving = false;
          const msg = err?.error?.message || 'Attendance update failed. Please try again.';
          alert(msg);
          console.error(err);
          this.cdr.detectChanges();
        }
      });

    } else {
      this.attendanceService.add(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Attendance added successfully.');
          this.closeForm();
          this.loadData();
        },
        error: (err: any) => {
          this.saving = false;
          const msg = err?.error?.message || 'Attendance save failed. Please try again.';
          alert(msg);
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }
}
