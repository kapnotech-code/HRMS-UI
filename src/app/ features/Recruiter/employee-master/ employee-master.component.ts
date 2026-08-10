import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

// ⚠️ Verify these import paths match your actual project structure
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/Department.Service';
import { DesignationService } from '../../../core/services/designation.service';
import { ShiftService } from '../../../core/services/shift.service';


import { EmployeeRequest } from '../../../shared/models/employee/employee-request';

import { EmployeeResponse } from '../../../shared/models/employee/ employee-response';
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
  styleUrls: ['./employee-master.component.css']
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
    { value: 'O', label: 'Other' }
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

  // ---------- Toast popup state ----------
  showToast = false;
  toastType: 'success' | 'error' = 'success';
  toastMessage = '';
  private toastTimer: any = null;

  // ---------- Searchable combobox state ----------
  codeSearchText = '';
  nameSearchText = '';
  codeOptionsOpen = false;
  nameOptionsOpen = false;
  filteredByCode: EmployeeResponse[] = [];
  filteredByName: EmployeeResponse[] = [];
  selectedEmployeeId: number | null = null;

  // ---------- File upload state ----------
  uploadingProfilePic = false;
  uploadingResume = false;

  // Set from the :id route param (when navigated here from the employee list
  // page's Edit button). Applied once employees have finished loading.
  private pendingEditId: number | null = null;

  formModel: EmployeeRequest = this.emptyForm();

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private shiftService: ShiftService,
    private companyService: EmployerService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef   // FIX: needed so toast/messages reliably update the view
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.pendingEditId = idParam ? Number(idParam) : null;

    this.loadEmployees();
    this.loadDropdownMasters();
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
      next: (res: any) => {
        this.employees = res.data ?? [];
        this.filteredByCode = this.employees;
        this.filteredByName = this.employees;
        this.managers = this.employees.map(e => ({ id: e.employeeID, name: this.fullName(e) }));
        this.loading = false;

        // If we arrived here via /Recruiter/employee-master/:id, load that
        // employee into the form now that the list (and managers) are ready.
        if (this.pendingEditId != null) {
          const target = this.employees.find(e => e.employeeID === this.pendingEditId);
          if (target) {
            this.applySelection(target);
          }
          this.pendingEditId = null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load employees. ' + this.extractError(err);
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
        this.departments = (res.data ?? []).map((d: any) => ({ id: d.departmentID, name: d.departmentName }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Department master load failed:', err)
    });

    this.designationService.getAll().subscribe({
      next: (res: any) => {
        this.designations = (res.data ?? []).map((d: any) => ({ id: d.designationID, name: d.designationName }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Designation master load failed:', err)
    });

    this.shiftService.getAll().subscribe({
      next: (res: any) => {
        this.shifts = (res.data ?? []).map((s: any) => ({ id: s.shiftID, name: s.shiftName }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Shift master load failed:', err)
    });
  }

  // ===================================================
  // SEARCHABLE + SYNCED COMBOBOX LOGIC
  // ===================================================

  fullName(emp: EmployeeResponse): string {
    return `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
  }

  onCodeInput(): void {
    this.codeOptionsOpen = true;
    const term = this.codeSearchText.toLowerCase();
    this.filteredByCode = this.employees.filter(e =>
      (e.employeeCode ?? '').toLowerCase().includes(term)
    );
  }

  onNameInput(): void {
    this.nameOptionsOpen = true;
    const term = this.nameSearchText.toLowerCase();
    this.filteredByName = this.employees.filter(e =>
      this.fullName(e).toLowerCase().includes(term)
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
    setTimeout(() => this.formPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
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
      }
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
      }
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
      department: '',
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
      resumePath: ''
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

      department: emp.department,
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
      resumePath: emp.resumePath
    };
  }

  newEmployee(): void {
    this.isEditMode = false;
    this.formModel = this.emptyForm();
    this.clearSelection();
    this.clearMessages();
    this.employeeForm?.resetForm(this.formModel);
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
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;

          this.errorMessage = 'Update failed. ' + this.extractError(err);
          this.showToastMessage('error', this.errorMessage);

          this.cdr.detectChanges();
        }
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

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;

          this.errorMessage = 'Add failed. ' + this.extractError(err);
          this.showToastMessage('error', this.errorMessage);

          this.cdr.detectChanges();
        }
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
}
