import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployerService } from '../../../core/services/company.service'; 
import { DepartmentService } from '../../../core/services/Department.Service';
import { DesignationService } from '../../../core/services/designation.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { LeaveRequestService } from '../../../core/services/leave.service';
import { EmployeeResponse } from '../../../shared/models/employee/employee-response';

interface Option {
  id: number;
  name: string;
}

type ReportView =
  | 'list'
  | 'employee-master'
  | 'appointment-letter'
  | 'identity-card'
  | 'salary-slip'
  | 'leave-report'
  | 'experience-letter';

interface ReportMenuItem {
  label: string;
  view: ReportView;
}

/** Tracks the real load result of a profile picture fetched via HttpClient,**/ 
interface ImageLoadState {
  status: 'loading' | 'ready' | 'error';
  url?: string;         
  errorMessage?: string; // human-readable reason, shown as a tooltip/text
}

@Component({
  selector: 'app-employee-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './Employee-report.component.html',
  styleUrls: ['./Employee-report.component.css']
})
export class EmployeeReportComponent implements OnInit, OnDestroy {
  // ---------- Data ----------
  employees: EmployeeResponse[] = [];
  filteredEmployees: EmployeeResponse[] = [];
  companies: Option[] = [];
  departments: Option[] = [];
  designations: Option[] = [];

  // ---------- UI state ----------
  loading = false;
  errorMessage = '';
  view: ReportView = 'list';
  selectedEmployee: EmployeeResponse | null = null;
  today = new Date();

  // ---------- Downloading state (used to disable button / show spinner) ----------
  downloadingPdf = false;

  // ---------- Filters ----------
  searchText = '';
  filterCompanyID: number | null = null;
  filterDepartment = '';
  filterDesignation = '';
  filterStatus = '';

  statusOptions = ['Active', 'Inactive', 'On Leave', 'Resigned'];

  // ---------- Reports dropdown menu ----------
  reportMenu: ReportMenuItem[] = [
    { label: 'Employee Master Report', view: 'employee-master' },
    { label: 'Appointment Letter', view: 'appointment-letter' },
    { label: 'Identity Card', view: 'identity-card' },
    { label: 'Salary Slip', view: 'salary-slip' },
  
    { label: 'Leave Report', view: 'leave-report' },
    { label: 'Experience Letter', view: 'experience-letter' },
   
  ];
  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    document.body.classList.add('print-mode');
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    document.body.classList.remove('print-mode');
  }

  // ---------- Custom dropdown state ----------

  dropdownOpen = false;
  dropdownEmployee: EmployeeResponse | null = null;
  dropdownTop = 0;
  dropdownLeft = 0;

  private scrollCloseHandler = () => this.closeDropdown();

  // Company name is now resolved dynamically per-employee via
  // getCompanyName(emp.companyID) directly in the template — no more
  // hardcoded placeholder.
  //
  // ⚠️ ASSUMPTION: company logo is still a placeholder — the Company
  // master (this.companies) currently only carries {id, name}. If the
  // company API also returns a logo URL, map it in loadDropdownMasters()
  // below (e.g. c.logoUrl) and resolve it the same way as the name via
  // a getCompanyLogo(companyID) helper.
  companyLogoUrl = '';
  qrCodeUrl = '';

  // ---------- File resolution ----------
  private readonly fileBaseUrl = environment.apiUrl.replace('/api', '');


  private profileImageState = new Map<number, ImageLoadState>();

  // ---------- Salary Slip (placeholder breakdown) ----------
  basic = 0;
  hra = 0;
  allowances = 0;
  bonus = 0;
  pf = 0;
  esi = 0;
  tax = 0;
  grossSalary = 0;
  totalDeductions = 0;
  netSalary = 0;

  // ---------- Attendance Report ----------
  attendanceRecords: any[] = [];
  attendanceLoading = false;
  presentCount = 0;
  absentCount = 0;
  leaveCount = 0;
  lateCount = 0;
  workingDaysCount = 0;

  // ---------- Leave Report ----------
  leaveRecords: any[] = [];
  leaveLoading = false;

  constructor(
    private employeeService: EmployeeService,
    private companyService: EmployerService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private attendanceService: AttendanceService,
    private leaveRequestService: LeaveRequestService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDropdownMasters();
    // capture:true lets us hear scroll events from nested scroll containers
    // (like the table's horizontal scroller), which don't otherwise bubble.
    window.addEventListener('scroll', this.scrollCloseHandler, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollCloseHandler, true);
    this.profileImageState.forEach(state => {
      if (state.url) URL.revokeObjectURL(state.url);
    });
  }

  // ===================================================
  // DATA LOADING (list page)
  // ===================================================

  loadEmployees(): void {
    this.loading = true;
    this.errorMessage = '';
    this.employeeService.getAll().subscribe({
      next: (res: any) => {
        this.employees = res ?? [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load employees.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDropdownMasters(): void {
    this.companyService.getAll().subscribe({
      next: (res: any) => {
        this.companies = (res.data ?? []).map((c: any) => ({ id: c.companyID, name: c.companyName }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Company master load failed:', err)
    });

    this.departmentService.getAll().subscribe({
      next: (res: any) => {
        this.departments = (res ?? []).map((d: any) => ({ id: d.departmentID, name: d.departmentName }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Department master load failed:', err)
    });

    this.designationService.getAll().subscribe({
      next: (res: any) => {
        this.designations = (res ?? []).map((d: any) => ({ id: d.designationID, name: d.designationName }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Designation master load failed:', err)
    });
  }

  // ===================================================
  // FILTERING
  // ===================================================

  applyFilters(): void {
    const term = this.searchText.trim().toLowerCase();

    this.filteredEmployees = this.employees.filter(e => {
      const nameMatch = !term ||
        this.fullName(e).toLowerCase().includes(term) ||
        (e.employeeCode ?? '').toLowerCase().includes(term);

      const companyMatch = !this.filterCompanyID || e.companyID === this.filterCompanyID;
      const deptMatch = !this.filterDepartment || e.department === this.filterDepartment;
      const designationMatch = !this.filterDesignation || e.designation === this.filterDesignation;
      const statusMatch = !this.filterStatus || e.employeeStatus === this.filterStatus;

      return nameMatch && companyMatch && deptMatch && designationMatch && statusMatch;
    });

    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.searchText = '';
    this.filterCompanyID = null;
    this.filterDepartment = '';
    this.filterDesignation = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  // ===================================================
  // HELPERS
  // ===================================================

  fullName(emp?: EmployeeResponse | null): string {
    const e = emp ?? this.selectedEmployee;
    if (!e) return '';
    return `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
  }

  getCompanyName(companyID: number | null | undefined): string {
    if (!companyID) return '-';
    return this.companies.find(c => c.id === companyID)?.name ?? '-';
  }

  /** Resolves a managerID / reportingManagerID to the employee's display name. */
  getManagerName(managerID: number | null | undefined): string {
    if (!managerID) return '-';
    const manager = this.employees.find(e => e.employeeID === managerID);
    return manager ? this.fullName(manager) : '-';
  }

  statusClass(status: string | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'active': return 'badge-active';
      case 'inactive': return 'badge-inactive';
      case 'on leave': return 'badge-leave';
      case 'resigned': return 'badge-resigned';
      default: return 'badge-inactive';
    }
  }

  /** Years/months between joining date and exit date (or today). */
  experienceDuration(): string {
    if (!this.selectedEmployee?.dateOfJoining) return '-';
    const start = new Date(this.selectedEmployee.dateOfJoining);
    const end = this.selectedEmployee.exitDate ? new Date(this.selectedEmployee.exitDate) : new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    if (months < 0) { years--; months += 12; }
    return `${years} year(s) ${months} month(s)`;
  }

  daysBetween(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }

  // ===================================================
  // FILE RESOLUTION (Profile Picture / Resume / any uploaded file)
  // ===================================================

  /**
   * Resolves a stored file path (e.g. emp.profilePicturePath, emp.resumePath)
   * into a browser-usable URL.
   *  - If the value is already an absolute URL (http/https), it's returned as-is
   *    (covers cases where files are served from cloud storage / a CDN).
   *  - Otherwise it's treated as a relative path returned by the API and is
   *    prefixed with the file server's base URL.
   *
   * ⚠️ Update `fileBaseUrl` above to match your actual backend/file host.
   */
  resolveFileUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${this.fileBaseUrl}${cleanPath}`;
  }

  /**
   * Returns the current load state of an employee's profile picture,
   * kicking off a real HttpClient fetch the first time it's asked for
   * (result is cached in `profileImageState` after that).
   *
   * Why HttpClient instead of a plain <img src>? A plain <img> tag only
   * ever tells you "it failed" via the (error) event — it can't tell you
   * WHY. Fetching through HttpClient surfaces the actual HTTP status
   * (404, CORS block, SSL failure, etc.) so we can show the real reason
   * in the UI instead of just a broken-image icon.
   */
  getProfileImageState(emp: EmployeeResponse): ImageLoadState | null {
    if (!emp.profilePicturePath) return null;

    const existing = this.profileImageState.get(emp.employeeID);
    if (existing) return existing;

    this.profileImageState.set(emp.employeeID, { status: 'loading' });
    this.fetchProfileImage(emp);
    return this.profileImageState.get(emp.employeeID)!;
  }

  private fetchProfileImage(emp: EmployeeResponse): void {
    const url = this.resolveFileUrl(emp.profilePicturePath);

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        // Guard against non-image responses (e.g. an HTML error page
        // returned with a 200 status) — these would otherwise "succeed"
        // here but still fail to render as an image.
        if (!blob.type.startsWith('image/')) {
          this.profileImageState.set(emp.employeeID, {
            status: 'error',
            errorMessage: `Server returned "${blob.type || 'unknown type'}" instead of an image. Check the file path/route on the backend.`
          });
          this.cdr.detectChanges();
          return;
        }
        const objectUrl = URL.createObjectURL(blob);
        this.profileImageState.set(emp.employeeID, { status: 'ready', url: objectUrl });
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        let message: string;
        if (err.status === 0) {
          message = 'Request blocked before reaching server — likely CORS policy or an untrusted SSL certificate on the backend.';
        } else if (err.status === 404) {
          message = 'File not found on server (404). Check the path and that the backend serves static files from that folder.';
        } else {
          message = `Server responded with error ${err.status} (${err.statusText || 'unknown'}).`;
        }
        this.profileImageState.set(emp.employeeID, { status: 'error', errorMessage: message });
        this.cdr.detectChanges();
      }
    });
  }

  // ===================================================
  // RESUME — VIEW / DOWNLOAD (supports PDF, DOC, DOCX)
  // ===================================================

  /** File extensions accepted for the resume actions. */
  private readonly allowedResumeExtensions = ['pdf', 'doc', 'docx'];

  /** employeeID of the row whose View/Download action is currently in flight
   *  (used to disable both buttons on that row while the fetch is pending). */
  resumeBusyId: number | null = null;

  /** employeeID -> human-readable error message, shown inline under the buttons. */
  private resumeErrorState = new Map<number, string>();

  getResumeError(emp: EmployeeResponse): string | null {
    return this.resumeErrorState.get(emp.employeeID) ?? null;
  }

  private getFileExtension(path: string): string {
    const clean = path.split('?')[0].split('#')[0];
    const parts = clean.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private getResumeMimeType(ext: string): string {
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return 'application/octet-stream';
    }
  }

  private describeFileError(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Unable to reach server (network issue or CORS/SSL block).';
    if (err.status === 404) return 'Resume file not found on the server.';
    if (err.status === 415) return 'Server rejected the file type.';
    return `Server error ${err.status} while fetching resume.`;
  }

  /** Shared validation used by both viewResume() and downloadResume().
   *  Returns the file extension on success, or null after recording an
   *  inline error message for that row. */
  private validateResume(emp: EmployeeResponse): string | null {
    this.resumeErrorState.delete(emp.employeeID);

    if (!emp.resumePath) {
      this.resumeErrorState.set(emp.employeeID, 'No resume uploaded.');
      return null;
    }

    const ext = this.getFileExtension(emp.resumePath);
    if (!this.allowedResumeExtensions.includes(ext)) {
      this.resumeErrorState.set(
        emp.employeeID,
        `Unsupported file type${ext ? ' ".' + ext + '"' : ''}. Only PDF, DOC, and DOCX are supported.`
      );
      return null;
    }

    return ext;
  }

  /** Opens the resume in a new browser tab. PDFs render inline; DOC/DOCX
   *  will be handled by the browser/OS according to its own file
   *  associations (most browsers will prompt to open or save them). */
  viewResume(emp: EmployeeResponse, event: MouseEvent): void {
    event.stopPropagation();
    const ext = this.validateResume(emp);
    if (!ext) {
      this.cdr.detectChanges();
      return;
    }

    this.resumeBusyId = emp.employeeID;
    this.cdr.detectChanges();

    const url = this.resolveFileUrl(emp.resumePath);

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.resumeBusyId = null;

        if (!blob || blob.size === 0) {
          this.resumeErrorState.set(emp.employeeID, 'Resume file is empty or corrupted.');
          this.cdr.detectChanges();
          return;
        }

        const typedBlob = new Blob([blob], { type: this.getResumeMimeType(ext) });
        const objectUrl = URL.createObjectURL(typedBlob);
        const newTab = window.open(objectUrl, '_blank');

        if (!newTab) {
          this.resumeErrorState.set(emp.employeeID, 'Pop-up blocked. Please allow pop-ups to view the resume.');
        }

        // Give the new tab time to load the blob before revoking it.
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.resumeBusyId = null;
        this.resumeErrorState.set(emp.employeeID, this.describeFileError(err));
        this.cdr.detectChanges();
      }
    });
  }

  /** Downloads the resume to the user's device with a clean, predictable
   *  filename, preserving the original file extension. */
  downloadResume(emp: EmployeeResponse, event: MouseEvent): void {
    event.stopPropagation();
    const ext = this.validateResume(emp);
    if (!ext) {
      this.cdr.detectChanges();
      return;
    }

    this.resumeBusyId = emp.employeeID;
    this.cdr.detectChanges();

    const url = this.resolveFileUrl(emp.resumePath);

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.resumeBusyId = null;

        if (!blob || blob.size === 0) {
          this.resumeErrorState.set(emp.employeeID, 'Resume file is empty or corrupted.');
          this.cdr.detectChanges();
          return;
        }

        const typedBlob = new Blob([blob], { type: this.getResumeMimeType(ext) });
        const objectUrl = URL.createObjectURL(typedBlob);
        const fileNameBase = (emp.employeeCode || this.fullName(emp) || `employee_${emp.employeeID}`).replace(/\s+/g, '_');
        const fileName = `${fileNameBase}_resume.${ext}`;

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);

        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.resumeBusyId = null;
        this.resumeErrorState.set(emp.employeeID, this.describeFileError(err));
        this.cdr.detectChanges();
      }
    });
  }

  // ===================================================
  // DELETE EMPLOYEE
  // ===================================================

  /** State used to disable the Delete button on the row currently being deleted. */
  deletingEmployeeId: number | null = null;

  /**
   * Deletes an employee after user confirmation. Closes the reports dropdown
   * first (in case it was open for this row), calls the delete API, and on
   * success removes the record from both `employees` and `filteredEmployees`
   * so the table updates immediately without a full reload.
   *
   * ⚠️ ASSUMPTION: EmployeeService has a delete(employeeId) method, e.g.:
   *   delete(employeeId: number): Observable<ApiResponse<any>> {
   *     return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${employeeId}`);
   *   }
   * If your service method has a different name (e.g. deleteEmployee, remove),
   * update the call below to match.
   */
  deleteEmployee(emp: EmployeeResponse, event: MouseEvent): void {
    event.stopPropagation();
    this.closeDropdown();

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${this.fullName(emp)} (${emp.employeeCode})? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.deletingEmployeeId = emp.employeeID;
    this.cdr.detectChanges();

    this.employeeService.delete(emp.employeeID, true).subscribe({   // ✅ FIX: hardDelete = true add kiya
      next: () => {
        alert('Employee deleted successfully.');

        this.employees = this.employees.filter(e => e.employeeID !== emp.employeeID);
        this.filteredEmployees = this.filteredEmployees.filter(e => e.employeeID !== emp.employeeID);

        this.deletingEmployeeId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('deleteEmployee: failed to delete employee', err);
        alert('Delete failed.');

        this.errorMessage = `Failed to delete ${this.fullName(emp)}. Please try again.`;
        this.deletingEmployeeId = null;
        this.cdr.detectChanges();
      }
    });
  }
  // ===================================================
  // REPORTS DROPDOWN (custom — does not depend on Bootstrap JS)
  // ===================================================

  toggleDropdown(emp: EmployeeResponse, event: MouseEvent): void {
    event.stopPropagation();

    const alreadyOpenForThisRow = this.dropdownOpen && this.dropdownEmployee?.employeeID === emp.employeeID;
    if (alreadyOpenForThisRow) {
      this.closeDropdown();
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    // Position just below the button. Flip to open upward if there isn't
    // enough room beneath it (e.g. last rows near the bottom of the screen).
    const menuHeightEstimate = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    this.dropdownTop = spaceBelow < menuHeightEstimate
      ? rect.top - menuHeightEstimate - 6
      : rect.bottom + 6;
    this.dropdownLeft = Math.min(rect.left, window.innerWidth - 210);

    this.dropdownEmployee = emp;
    this.dropdownOpen = true;
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.dropdownOpen = false;
    this.dropdownEmployee = null;
  }

  // ===================================================
  // REPORT NAVIGATION (all inline — no routing)
  // ===================================================

  /** Called from the Reports dropdown on each table row. */
  openReport(reportView: ReportView, emp: EmployeeResponse): void {
    this.closeDropdown();
    this.selectedEmployee = emp;
    this.view = reportView;

    if (reportView === 'identity-card') {
      const qrData = encodeURIComponent(`Employee: ${this.fullName(emp)} | Code: ${emp.employeeCode}`);
      this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
    }

    if (reportView === 'salary-slip') {
      this.computeSalaryBreakdown(emp.salary ?? 0);
    }

 

    if (reportView === 'leave-report') {
      this.loadLeaves(emp.employeeID);
    }

    this.cdr.detectChanges();
  }

  backToList(): void {
    this.selectedEmployee = null;
    this.view = 'list';
    this.attendanceRecords = [];
    this.leaveRecords = [];
    this.cdr.detectChanges();
  }

  // ===================================================
  // SALARY SLIP — placeholder breakdown
  // ===================================================

  /** ⚠️ Placeholder payroll math — replace with real payroll API/rules. */
  private computeSalaryBreakdown(monthlySalary: number): void {
    this.basic = Math.round(monthlySalary * 0.50);
    this.hra = Math.round(monthlySalary * 0.20);
    this.allowances = Math.round(monthlySalary * 0.20);
    this.bonus = Math.round(monthlySalary * 0.10);
    this.grossSalary = this.basic + this.hra + this.allowances + this.bonus;

    this.pf = Math.round(this.basic * 0.12);
    this.esi = this.grossSalary <= 21000 ? Math.round(this.grossSalary * 0.0075) : 0;
    this.tax = 0; // ⚠️ placeholder — wire up real TDS calculation if needed
    this.totalDeductions = this.pf + this.esi + this.tax;

    this.netSalary = this.grossSalary - this.totalDeductions;
  }

  // ===================================================
  // ATTENDANCE REPORT
  // ===================================================

  loadAttendance(employeeId: number): void {
    this.attendanceLoading = true;
    // ⚠️ Assumes AttendanceService.getByEmployee(employeeId) exists,
    // matching the pattern already used in AttendanceList.ts.
    this.attendanceService.getByEmployee(employeeId).subscribe({
      next: (res: any) => {
        this.attendanceRecords = res ?? [];
        this.computeAttendanceSummary();
        this.attendanceLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.attendanceLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private computeAttendanceSummary(): void {
    this.presentCount = this.attendanceRecords.filter(a => (a.status ?? '').toLowerCase() === 'present').length;
    this.absentCount = this.attendanceRecords.filter(a => (a.status ?? '').toLowerCase() === 'absent').length;
    this.leaveCount = this.attendanceRecords.filter(a => (a.status ?? '').toLowerCase() === 'leave').length;
    this.lateCount = this.attendanceRecords.filter(a => (a.status ?? '').toLowerCase() === 'late').length;
    this.workingDaysCount = this.attendanceRecords.length;
  }

  // ===================================================
  // LEAVE REPORT
  // ===================================================

  loadLeaves(employeeId: number): void {
    this.leaveLoading = true;
    // ⚠️ ASSUMPTION: LeaveRequestService needs a getByEmployee(employeeId)
    // method. Only getPendingApprovals()/add()/approveOrReject() were
    // confirmed earlier — add this method to the service if missing:
    //
    //   getByEmployee(employeeId: number): Observable<ApiResponse<LeaveResponse[]>> {
    //     return this.http.get<ApiResponse<LeaveResponse[]>>(`${this.apiUrl}/employee/${employeeId}`);
    //   }
    this.leaveRequestService.getByEmployee(employeeId).subscribe({
      next: (res: any) => {
        this.leaveRecords = res.data ?? [];
        this.leaveLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.leaveLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================================================
  // PRINT (unchanged — opens native browser print dialog)
  // ===================================================

  /** Opens the native browser print dialog. CSS @media print rules
   *  (see .no-print / #printArea) control what actually gets printed.
   *  Kept separate from downloadPdf() below — this is only for the
   *  "Print" button, which is expected to open the print dialog. */
  print(): void {
    window.print();
  }

  // ===================================================
  // DOWNLOAD PDF — real client-side PDF generation
  // (no print dialog, only #printArea content, no sidebar/list/filters)
  // ===================================================

  /**
   * Captures only the #printArea element (the currently visible report —
   * Employee Master / Appointment Letter / ID Card / Salary Slip /
   * Attendance / Leave / Experience / Relieving letter) and downloads it
   * directly as a .pdf file. Sidebar, filters, table list, and any
   * `.no-print` elements (buttons, disclaimers, toolbar) are excluded.
   *
   * Requires: npm install html2canvas jspdf
   */
  downloadPdf(): void {
    const original = document.getElementById('printArea');
    if (!original) {
      console.error('downloadPdf: #printArea not found in DOM.');
      return;
    }

    if (this.downloadingPdf) return; // prevent double-click double-download
    this.downloadingPdf = true;
    this.cdr.detectChanges();

    // Clone the report node so we never mutate what's on screen, and so
    // we can safely strip out any .no-print elements (toolbar buttons,
    // disclaimers, "view attachment" links) before rendering to canvas.
    const clone = original.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.no-print').forEach(el => el.remove());

    // Render the clone off-screen (not display:none — html2canvas needs
    // real layout/paint) so nothing else on the page is captured.
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '-10000px';
    clone.style.zIndex = '-1';
    clone.style.width = original.offsetWidth + 'px';
    clone.style.background = '#ffffff';
    document.body.appendChild(clone);

    html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })
      .then(canvas => {
        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;

        // Extra pages if the report content is taller than one A4 page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfPageHeight;
        }

        const empCode = this.selectedEmployee?.employeeCode || 'employee';
        const empName = this.fullName(this.selectedEmployee).replace(/\s+/g, '_') || 'report';
        const reportLabel = this.view; // e.g. 'employee-master', 'salary-slip'
        const fileName = `${reportLabel}_${empName}_${empCode}.pdf`;

        pdf.save(fileName); // ← direct file download, no print dialog

        this.downloadingPdf = false;
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error('downloadPdf: failed to generate PDF', err);
        if (clone.parentNode) {
          document.body.removeChild(clone);
        }
        this.downloadingPdf = false;
        this.cdr.detectChanges();
      });
  }

  // ===================================================
  // EXPORT TO CSV (list page)
  // ===================================================

  exportToCsv(): void {
    if (!this.filteredEmployees.length) {
      alert('No data for export.');
      return;
    }

    const headers = [
      'Employee Code', 'Name', 'Department', 'Designation', 'Company',
      'Email', 'Phone', 'Joining Date', 'Status'
    ];

    const rows = this.filteredEmployees.map(e => [
      e.employeeCode ?? '',
      this.fullName(e),
      e.department ?? '',
      e.designation ?? '',
      this.getCompanyName(e.companyID),
      e.email ?? '',
      e.phone ?? '',
      e.dateOfJoining ? e.dateOfJoining.substring(0, 10) : '',
      e.employeeStatus ?? ''
    ]);

    const escapeCsv = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [headers, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Employee_Report_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

