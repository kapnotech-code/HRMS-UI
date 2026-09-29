import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// ⚠️ Verify these import paths match your actual project structure
import { EmployeeService } from '../../../core/services/employee.service';
import { FrontendPermissionService } from '../../../core/services/frontend-permission.service';
import { DepartmentService } from '../../../core/services/Department.Service';
import { DesignationService } from '../../../core/services/designation.service';
import { ShiftService } from '../../../core/services/shift.service';

import { EmployeeRequest } from '../../../shared/models/employee/employee-request';
import { EmployeeResponse } from '../../../shared/models/employee/employee-response';
import { EmployerService } from '../../../core/services/company.service';

interface Option {
  id: number;
  name: string;
}

interface Option2 {
  value: string;
  label: string;
}

@Component({
  selector: 'app-employee-master',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-master.component.html',
  styleUrls: ['./employee-master.component.css'],
})
export class EmployeeMasterComponent implements OnInit {
  @ViewChild('formPanel') formPanel!: ElementRef<HTMLElement>;
  @ViewChild('employeeForm') employeeForm!: NgForm;

  // ---------- Data ----------
  employees: EmployeeResponse[] = [];
  companies: Option[] = [];
  departments: Option[] = [];
  designations: Option[] = [];
  shifts: Option[] = [];
  managers: Option[] = [];

  // ---------- Static dropdown option lists ----------
  statusOptions = ['Active', 'Inactive', 'On Leave', 'Resigned'];
  genderOptions: Option2[] = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
  ];
  maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  employmentTypeOptions = ['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Consultant'];

  // ---------- UI state ----------
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;

  // permissions
  canAdd = true;
  canEdit = true;
  canDelete = true;

  // delete confirmation
  showDeleteConfirm = false;
  employeeToDelete: EmployeeResponse | null = null;

  // form visibility
  showForm = false;

  // ---------- Toast popup state ----------
  showToast = false;
  toastType: 'success' | 'error' = 'success';
  toastMessage = '';
  private toastTimer: any = null;

  // ---------- Searchable combobox state (Employee Code / Name) ----------
  codeSearchText = '';
  nameSearchText = '';
  codeOptionsOpen = false;
  nameOptionsOpen = false;
  filteredByCode: EmployeeResponse[] = [];
  filteredByName: EmployeeResponse[] = [];
  selectedEmployeeId: number | null = null;

  // ---------- Manager / Reporting Manager — manual text input (no dropdown) ----------
  managerSearchText = '';
  reportingManagerSearchText = '';

  // ---------- File upload state ----------
  uploadingProfilePic = false;
  uploadingResume = false;
  uploadingDocument = false;
  documentFiles: { file: File; previewUrl: string }[] = [];

  // Set from the :id route param (when navigated here from the employee list
  // page's Edit button). Applied once employees have finished loading.
  private pendingEditId: number | null = null;

  formModel: EmployeeRequest = this.emptyForm();

  // Navigate to the Reports page after a successful save
  navigateAfterSave = true;

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private shiftService: ShiftService,
    private companyService: EmployerService,
    private frontendPerm: FrontendPermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.pendingEditId = idParam ? Number(idParam) : null;

    this.loadEmployees();
    this.loadDropdownMasters();
    this.loadPermissions();
  }

  loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    this.canAdd = this.frontendPerm.canAddByUrl('/Recruiter/employee-master');
    this.canEdit = this.frontendPerm.canEditByUrl('/Recruiter/employee-master');
    this.canDelete = this.frontendPerm.canDeleteByUrl('/Recruiter/employee-master');
    this.cdr.detectChanges();
  }

  // ===================================================
  // TOAST POPUP (auto-hides after a few seconds)
  // ===================================================

  private showToastMessage(type: 'success' | 'error', message: string, durationMs = 3000): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.toastMessage = '';
      this.toastTimer = null;
      this.cdr.detectChanges();
    }, durationMs);
  }

  dismissToast(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.showToast = false;
    this.toastMessage = '';
  }

  // ===================================================
  // DATA LOADING
  // ===================================================

  loadEmployees(): void {
    this.loading = true;
    this.clearMessages();
    this.employeeService.getAll().subscribe({
      next: (emps: EmployeeResponse[]) => {
        this.employees = emps ?? [];
        this.filteredByCode = this.employees;
        this.filteredByName = this.employees;
        this.managers = this.employees.map((e) => ({ id: e.employeeID, name: this.fullName(e) }));
        this.loading = false;

        // If we arrived here via /Recruiter/employee-master/:id, load that
        // employee into the form now that the list (and managers) are ready.
        if (this.pendingEditId != null) {
          const target = this.employees.find((e) => e.employeeID === this.pendingEditId);
          if (target) {
            this.applySelection(target);
          } else {
            // Fallback: fetch the single employee by ID
            this.employeeService.getById(this.pendingEditId).subscribe({
              next: (emp: EmployeeResponse) => {
                if (emp) {
                  this.applySelection(emp);
                }
                this.cdr.detectChanges();
              },
              error: () => this.cdr.detectChanges(),
            });
          }
          this.pendingEditId = null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load employees. ' + this.extractError(err);
        this.loading = false;

        // Even on list load failure, try to load by :id if present
        if (this.pendingEditId != null) {
          this.employeeService.getById(this.pendingEditId).subscribe({
            next: (emp: EmployeeResponse) => {
              if (emp) {
                this.employees = [emp, ...this.employees];
                this.applySelection(emp);
              }
              this.cdr.detectChanges();
            },
            error: () => this.cdr.detectChanges(),
          });
          this.pendingEditId = null;
        }
        this.cdr.detectChanges();
      },
    });
  }

  loadDropdownMasters(): void {
    this.companyService.getAll().subscribe({
      next: (res: any) => {
        this.companies = (res.data ?? []).map((c: any) => ({
          id: c.companyID,
          name: c.companyName,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Company master load failed:', err),
    });

    this.departmentService.getAll().subscribe({
      next: (res: any) => {
        this.departments = (Array.isArray(res) ? res : (res.data ?? [])).map((d: any) => ({
          id: d.departmentID,
          name: d.departmentName,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Department master load failed:', err),
    });

    this.designationService.getAll().subscribe({
      next: (res: any) => {
        this.designations = (Array.isArray(res) ? res : (res.data ?? [])).map((d: any) => ({
          id: d.designationID,
          name: d.designationName,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Designation master load failed:', err),
    });

    this.shiftService.getAll().subscribe({
      next: (res: any) => {
        this.shifts = (Array.isArray(res) ? res : (res.data ?? [])).map((s: any) => ({
          id: s.shiftID,
          name: s.shiftName,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Shift master load failed:', err),
    });
  }

  // ===================================================
  // SEARCHABLE + SYNCED COMBOBOX LOGIC (Employee Code / Name)
  // ===================================================

  fullName(emp: EmployeeResponse): string {
    return (
      `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() ||
      emp.employeeName ||
      `Employee #${emp.employeeID}`
    );
  }

  onCodeInput(): void {
    this.codeOptionsOpen = true;
    const term = this.codeSearchText.toLowerCase();
    this.filteredByCode = this.employees.filter((e) =>
      (e.employeeCode ?? '').toLowerCase().includes(term),
    );
  }

  onNameInput(): void {
    this.nameOptionsOpen = true;
    const term = this.nameSearchText.toLowerCase();
    this.filteredByName = this.employees.filter((e) =>
      this.fullName(e).toLowerCase().includes(term),
    );
  }

  selectByCode(emp: EmployeeResponse): void {
    this.codeOptionsOpen = false;
    this.applySelection(emp);
  }

  selectByName(emp: EmployeeResponse): void {
    this.nameOptionsOpen = false;
    this.applySelection(emp);
  }

  // Called by the dropdowns AND when arriving via /:id from the list page
  private applySelection(emp: EmployeeResponse): void {
    this.selectedEmployeeId = emp.employeeID;
    this.showForm = true;
    this.codeSearchText = emp.employeeCode;
    this.nameSearchText = this.fullName(emp);
    this.loadFormFromEmployee(emp);
    this.scrollToForm();
  }

  clearSelection(): void {
    this.codeSearchText = '';
    this.nameSearchText = '';
    this.selectedEmployeeId = null;
    this.filteredByCode = this.employees;
    this.filteredByName = this.employees;
  }

  private scrollToForm(): void {
    setTimeout(
      () => this.formPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      0,
    );
  }

  // ===================================================
  // MANAGER / REPORTING MANAGER — manual text input (no dropdown)
  // User poora naam khud type karta hai. Har keystroke aur blur par
  // us naam se exact (case-insensitive) match employees list mein
  // dhoondha jaata hai taaki backend ke liye ID mil sake. Match na
  // milne par field khaali kar di jaati hai taaki galat/adhura naam
  // save na ho.
  // ===================================================

  onManagerInput(): void {
    const term = this.managerSearchText.trim().toLowerCase();
    if (!term) {
      this.formModel.managerID = undefined;
      return;
    }
    const match = this.managers.find((m) => m.name.toLowerCase() === term);
    this.formModel.managerID = match ? match.id : undefined;
  }

  onManagerBlur(): void {
    const term = this.managerSearchText.trim().toLowerCase();
    const match = this.managers.find((m) => m.name.toLowerCase() === term);
    this.formModel.managerID = match ? match.id : undefined;
    if (!match) {
      this.managerSearchText = '';
    }
    this.cdr.detectChanges();
  }

  onReportingManagerInput(): void {
    const term = this.reportingManagerSearchText.trim().toLowerCase();
    const match = term ? this.managers.find((m) => m.name.toLowerCase() === term) : undefined;
    this.formModel.reportingManagerID = match ? match.id : undefined;
    // NOTE: reportingManagerSearchText ko yahan kabhi touch nahi karte —
    // jo user type kare wahi text box mein rahega, sirf ID silently resolve hoti hai
  }

  onReportingManagerBlur(): void {
    const term = this.reportingManagerSearchText.trim().toLowerCase();
    const match = term ? this.managers.find((m) => m.name.toLowerCase() === term) : undefined;
    this.formModel.reportingManagerID = match ? match.id : undefined;
    // Text clear NAHI karna — pehle yahi line thi jo blur hote hi field khaali kar deti thi
  }

  // Manager array se naam dhoondhne ka helper — edit mode prefill ke liye
  private managerNameById(id: number | undefined | null): string {
    if (id == null) return '';
    return this.managers.find((m) => m.id === id)?.name ?? '';
  }

  // ===================================================
  // FILE UPLOAD (Profile Picture / Resume)
  // ===================================================

  onProfilePicSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.showToastMessage('error', 'Profile picture must be 5MB or smaller.');
      input.value = '';
      return;
    }

    this.uploadingProfilePic = true;
    this.employeeService.uploadFile(file, 'profile').subscribe({
      next: (res: any) => {
        this.formModel.profilePicturePath = res.data?.filePath ?? res.filePath;
        this.uploadingProfilePic = false;
        this.showToastMessage('success', 'Profile picture uploaded.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploadingProfilePic = false;
        this.showToastMessage('error', 'Profile picture upload failed. ' + this.extractError(err));
        this.cdr.detectChanges();
      },
    });
    input.value = '';
  }

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.showToastMessage('error', 'Resume must be 10MB or smaller.');
      input.value = '';
      return;
    }

    this.uploadingResume = true;
    this.employeeService.uploadFile(file, 'resume').subscribe({
      next: (res: any) => {
        this.formModel.resumePath = res.data?.filePath ?? res.filePath;
        this.uploadingResume = false;
        this.showToastMessage('success', 'Resume uploaded.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploadingResume = false;
        this.showToastMessage('error', 'Resume upload failed. ' + this.extractError(err));
        this.cdr.detectChanges();
      },
    });
    input.value = '';
  }

  removeProfilePic(): void {
    this.formModel.profilePicturePath = '';
  }

  removeResume(): void {
    this.formModel.resumePath = '';
  }

  // ===================================================
  // FORM LOGIC
  // ===================================================

  emptyForm(): EmployeeRequest {
    return {
      // Basic identity
      companyID: undefined,
      employeeCode: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      dateOfJoining: this.today(),

      // Job details
      department: undefined,
      designation: '',
      salary: undefined,
      managerID: undefined,
      reportingManagerID: undefined,
      employmentType: '',
      workLocation: '',
      shiftType: '',
      probationEndDate: '',
      confirmationDate: '',
      exitDate: '',
      exitReason: '',
      employeeStatus: 'Active',
      isActive: true,

      // Family / personal
      fatherName: '',
      motherName: '',
      maritalStatus: '',
      bloodGroup: '',
      nationality: '',
      highestQualification: '',

      // Identity documents
      aadharNumber: '',
      panNumber: '',
      passportNumber: '',

      // Contact & address
      alternatePhone: '',
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      country: '',
      pinCode: '',

      // Emergency contact
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',

      // Bank / statutory
      bankName: '',
      bankAccountNumber: '',
      ifscCode: '',
      uan: '',
      pfNumber: '',
      esicNumber: '',

      // Attachments
      profilePicturePath: '',
      resumePath: '',
    };
  }

  today(): string {
    return new Date().toISOString().substring(0, 10);
  }

  private toDateInput(value: string | undefined | null): string {
    return value ? value.substring(0, 10) : '';
  }

  loadFormFromEmployee(emp: EmployeeResponse): void {
    this.isEditMode = true;
    this.clearMessages();
    this.formModel = {
      employeeID: emp.employeeID,
      companyID: emp.companyID,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      gender: emp.gender,
      dateOfBirth: this.toDateInput(emp.dateOfBirth),
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.substring(0, 10) : this.today(),

      department:
        typeof emp.department === 'string'
          ? this.departments.find((d) => d.id === Number(emp.department))?.name || emp.department
          : (emp.department as unknown as number | null),
      designation: emp.designation,
      salary: emp.salary,
      managerID: emp.managerID,
      reportingManagerID: emp.reportingManagerID,
      employmentType: emp.employmentType,
      workLocation: emp.workLocation,
      shiftType: emp.shiftType,
      probationEndDate: this.toDateInput(emp.probationEndDate),
      confirmationDate: this.toDateInput(emp.confirmationDate),
      exitDate: this.toDateInput(emp.exitDate),
      exitReason: emp.exitReason,
      employeeStatus: emp.employeeStatus,
      isActive: emp.isActive,

      fatherName: emp.fatherName,
      motherName: emp.motherName,
      maritalStatus: emp.maritalStatus,
      bloodGroup: emp.bloodGroup,
      nationality: emp.nationality,
      highestQualification: emp.highestQualification,

      aadharNumber: emp.aadharNumber,
      panNumber: emp.panNumber,
      passportNumber: emp.passportNumber,

      alternatePhone: emp.alternatePhone,
      currentAddress: emp.currentAddress,
      permanentAddress: emp.permanentAddress,
      city: emp.city,
      state: emp.state,
      country: emp.country,
      pinCode: emp.pinCode,

      emergencyContactName: emp.emergencyContactName,
      emergencyContactPhone: emp.emergencyContactPhone,
      emergencyContactRelation: emp.emergencyContactRelation,

      bankName: emp.bankName,
      bankAccountNumber: emp.bankAccountNumber,
      ifscCode: emp.ifscCode,
      uan: emp.uan,
      pfNumber: emp.pfNumber,
      esicNumber: emp.esicNumber,

      profilePicturePath: emp.profilePicturePath,
      resumePath: emp.resumePath,
    } as unknown as EmployeeRequest;

    // Manager / Reporting Manager text fields prefill karo, warna edit mode
    // mein khaali dikhenge jabki formModel mein ID already set hai.
    this.managerSearchText = this.managerNameById(emp.managerID);
    this.reportingManagerSearchText = this.managerNameById(emp.reportingManagerID);
  }

  newEmployee(): void {
    this.isEditMode = false;
    this.showForm = true;
    this.formModel = this.emptyForm();
    this.clearSelection();
    this.clearMessages();

    // Manager text fields bhi reset karo
    this.managerSearchText = '';
    this.reportingManagerSearchText = '';
    this.documentFiles = [];

    this.employeeForm?.resetForm(this.formModel);
  }

  closeForm(): void {
    this.showForm = false;
    this.clearSelection();
    this.newEmployee();
    this.cdr.detectChanges();
  }

  saveForm(): void {
    this.clearMessages();

    // Backend conversion handling
    if (!this.formModel.gender) {
      this.formModel.gender = undefined;
    }

    if (!this.formModel.dateOfBirth) {
      this.formModel.dateOfBirth = undefined;
    }

    if (!this.formModel.probationEndDate) {
      this.formModel.probationEndDate = undefined;
    }

    if (!this.formModel.confirmationDate) {
      this.formModel.confirmationDate = undefined;
    }

    if (!this.formModel.exitDate) {
      this.formModel.exitDate = undefined;
    }

    this.saving = true;

    if (this.isEditMode && this.formModel.employeeID) {
      // UPDATE
      this.employeeService.update(this.formModel.employeeID, this.formModel).subscribe({
        next: (res: any) => {
          this.saving = false;

          this.successMessage = res.message || 'Employee updated successfully.';
          this.showToastMessage('success', this.successMessage);

          this.loadEmployees();

          window.dispatchEvent(new CustomEvent('employeeListChanged'));

          this.newEmployee();
          if (this.navigateAfterSave) {
            this.router.navigate(['/Recruiter/Report']);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;

          this.errorMessage = 'Update failed. ' + this.extractError(err);
          this.showToastMessage('error', this.errorMessage);

          this.cdr.detectChanges();
        },
      });
    } else {
      // ADD
      this.employeeService.add(this.formModel).subscribe({
        next: (res: any) => {
          this.saving = false;

          this.successMessage = res.message || 'Employee added successfully.';
          this.showToastMessage('success', this.successMessage);

          this.newEmployee();
          this.loadEmployees();

          window.dispatchEvent(new CustomEvent('employeeListChanged'));

          if (this.navigateAfterSave) {
            this.router.navigate(['/Recruiter/Report']);
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;

          this.errorMessage = 'Add failed. ' + this.extractError(err);
          this.showToastMessage('error', this.errorMessage);

          this.cdr.detectChanges();
        },
      });
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private extractError(err: any): string {
    if (err?.error?.title) return err.error.title;
    if (typeof err?.error === 'string') return err.error;
    if (err?.message) return err.message;
    return 'Please check the server connection.';
  }

  // ===================================================
  // DELETE
  // ===================================================

  confirmDelete(emp: EmployeeResponse): void {
    this.employeeToDelete = emp;
    this.showDeleteConfirm = true;
    this.cdr.detectChanges();
  }

  confirmDeleteFromForm(): void {
    if (!this.formModel.employeeID) return;
    const emp = this.employees.find((e) => e.employeeID === this.formModel.employeeID);
    this.employeeToDelete =
      emp ??
      ({
        employeeID: this.formModel.employeeID,
        employeeCode: this.formModel.employeeCode,
        firstName: this.formModel.firstName || '',
        lastName: this.formModel.lastName || '',
        email: this.formModel.email || '',
        phone: this.formModel.phone || '',
        department: this.formModel.department ?? '',
        designation: this.formModel.designation ?? '',
        employeeStatus: this.formModel.employeeStatus ?? '',
        companyID: this.formModel.companyID ?? 0,
        isActive: this.formModel.isActive ?? true,
        dateOfBirth: this.formModel.dateOfBirth ?? '',
        dateOfJoining: this.formModel.dateOfJoining ?? '',
        gender: this.formModel.gender ?? '',
        salary: this.formModel.salary ?? 0,
        managerID: this.formModel.managerID ?? 0,
        reportingManagerID: this.formModel.reportingManagerID ?? 0,
        employmentType: this.formModel.employmentType ?? '',
        workLocation: this.formModel.workLocation ?? '',
        shiftType: this.formModel.shiftType ?? '',
        probationEndDate: this.formModel.probationEndDate ?? '',
        confirmationDate: this.formModel.confirmationDate ?? '',
        exitDate: this.formModel.exitDate ?? '',
        exitReason: this.formModel.exitReason ?? '',
        fatherName: this.formModel.fatherName ?? '',
        motherName: this.formModel.motherName ?? '',
        maritalStatus: this.formModel.maritalStatus ?? '',
        bloodGroup: this.formModel.bloodGroup ?? '',
        nationality: this.formModel.nationality ?? '',
        aadharNumber: this.formModel.aadharNumber ?? '',
        panNumber: this.formModel.panNumber ?? '',
        passportNumber: this.formModel.passportNumber ?? '',
        alternatePhone: this.formModel.alternatePhone ?? '',
        currentAddress: this.formModel.currentAddress ?? '',
        permanentAddress: this.formModel.permanentAddress ?? '',
        city: this.formModel.city ?? '',
        state: this.formModel.state ?? '',
        country: this.formModel.country ?? '',
        pinCode: this.formModel.pinCode ?? '',
        emergencyContactName: this.formModel.emergencyContactName ?? '',
        emergencyContactPhone: this.formModel.emergencyContactPhone ?? '',
        emergencyContactRelation: this.formModel.emergencyContactRelation ?? '',
        bankName: this.formModel.bankName ?? '',
        bankAccountNumber: this.formModel.bankAccountNumber ?? '',
        ifscCode: this.formModel.ifscCode ?? '',
        uan: this.formModel.uan ?? '',
        pfNumber: this.formModel.pfNumber ?? '',
        esicNumber: this.formModel.esicNumber ?? '',
        highestQualification: this.formModel.highestQualification ?? '',
        profilePicturePath: this.formModel.profilePicturePath ?? '',
        resumePath: this.formModel.resumePath ?? '',
        createdDate: '',
        modifiedDate: '',
      } as EmployeeResponse);
    this.showDeleteConfirm = true;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.employeeToDelete = null;
  }

  deleteEmployee(): void {
    if (!this.employeeToDelete) return;
    const emp = this.employeeToDelete;

    this.employeeService.delete(emp.employeeID).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.employeeToDelete = null;
        this.showToastMessage('success', 'Employee deleted successfully.');
        this.loadEmployees();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Delete failed. ' + this.extractError(err);
        this.showToastMessage('error', this.errorMessage);
        this.cdr.detectChanges();
      },
    });
  }

  // ===================================================
  // HELPERS
  // ===================================================

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

  // ===================================================
  // ADDITIONAL DOCUMENT UPLOAD
  // ===================================================

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        this.showToastMessage('error', `File "${file.name}" exceeds 10MB limit.`);
        continue;
      }

      this.uploadingDocument = true;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');

      this.employeeService.uploadFile(file, 'document').subscribe({
        next: (res: any) => {
          const filePath = res.data?.filePath ?? res.filePath ?? '';
          this.documentFiles.push({ file, previewUrl: filePath });
          this.uploadingDocument = false;
          this.showToastMessage('success', `Document "${file.name}" uploaded.`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.uploadingDocument = false;
          this.showToastMessage(
            'error',
            `Upload failed for "${file.name}". ` + this.extractError(err),
          );
          this.cdr.detectChanges();
        },
      });
    }
    input.value = '';
  }

  removeDocument(index: number): void {
    this.documentFiles.splice(index, 1);
    this.cdr.detectChanges();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
