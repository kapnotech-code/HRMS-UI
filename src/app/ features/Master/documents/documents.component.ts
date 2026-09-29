import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DocumentsService } from '../../../core/services/documents.service';
import { DocumentsResponse } from '../../../shared/models/documents/documents-response.model';
import { DocumentsRequest } from '../../../shared/models/documents/documents-request.model';

// Actual document types service/model
import { DocumentTypesService } from '../../../core/services/documentsnew.service';
import { DocumentTypesResponse } from '../../../shared/models/Documentsnew/documentsnew-typerequest.model';

// Actual Employee service. Adjust the model path to match your actual filename
// (the original snippet used 'employee-response'; ".model" suffix convention followed like the other files)
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponse } from '../../../shared/models/employee/employee-response';

// Company service — the actual class name in the file is "EmployerService" (inside company.service.ts),
// so it's aliased "as CompanyService" so the rest of the code below works unchanged.
import { EmployerService as CompanyService } from '../../../../app/core/services/company.service';
import { CompanyResponse } from '../../../shared/models/companylist/CompanyResponse';
import { DocumentCategoryService } from '../../../core/services/document-category.service';
import { DocumentCategory } from '../../../shared/models/documentcategory/document';
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {
  documents: DocumentsResponse[] = [];
  documentTypes: DocumentTypesResponse[] = [];
  items: DocumentTypesResponse[] = [];
  categories: DocumentCategory[] = [];  // dropdown data
  employees: EmployeeResponse[] = [];            // employee dropdown data
  employeesLoading = false;
  employeesError = '';

  // Company dropdown data (same pattern as Employee)
  companies: CompanyResponse[] = [];
  companiesLoading = false;
  companiesError = '';

  documentForm!: FormGroup;

  // ---------- File upload state ----------
  selectedFile: File | null = null;
  fileError = '';
  // In edit mode, if a file was already uploaded, its name is stored here — used to show
  // a preview card instead of the dropzone.
  existingFileName: string | null = null;

  // Module dropdown options. "Employee" and "Company" cases have their own special picker behavior.
  // New modules can be added here (like Project, Asset, Client, etc.)
  readonly moduleOptions: string[] = ['Employee', 'Company', 'Project', 'Asset', 'Client'];

  isEdit = false;
  showModal = false;

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  // per-row delete loading state (CompanyList pattern)
  deletingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private documentsService: DocumentsService,
    private documentTypesService: DocumentTypesService,
    private categoryService: DocumentCategoryService, // newly injected
    private employeeService: EmployeeService,              // for employee dropdown
    private companyService: CompanyService,                // for company dropdown
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDocuments();
    this.loadDocumentTypes();   // load dropdown
    this.loadEmployees();       // load employee dropdown
    this.loadCompanies();

  }

  initForm(): void {
    this.documentForm = this.fb.group({
      documentID: [0],

      // Dropdown — 0 means "nothing selected", hence min(1)
      documentTypeId: [0, [Validators.required, Validators.min(1)]],

      // Title — required, with a meaningful length
      documentTitle: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],

      // Description — optional, just a length limit
      description: ['', [Validators.maxLength(1000)]],

      moduleName: ['', [Validators.required, Validators.maxLength(100)]],

      // Reference ID — required and must be greater than 0
      // Starts as null (empty box) instead of 0, so it doesn't show as invalid before the user touches it
      referenceId: [null, [Validators.required, Validators.min(1)]],

      // File info — these are now auto-filled from the file picker, hence required
      originalFileName: ['', [Validators.required, Validators.maxLength(255)]],
      storedFileName: ['', [Validators.maxLength(255)]],
      filePath: ['', [Validators.maxLength(500)]],

      // Extension — only allow a pattern like ".pdf" / ".docx" (dot + letters/numbers)
      fileExtension: ['', [Validators.required, Validators.pattern(/^\.[a-zA-Z0-9]{1,10}$/)]],

      // File size — cannot be negative, with a reasonable upper limit (100 MB = 102400 KB)
      fileSizeKB: [null, [Validators.required, Validators.min(0), Validators.max(102400)]],

      // Version — if provided, must be at least 1
      versionNo: [null, [Validators.min(1)]],

      effectiveDate: [null],
      expiryDate: [null],

      isConfidential: [false],
      status: ['Active', [Validators.required]],

      // Uploaded By — if provided, must be a valid positive user id
      uploadedBy: [null, [Validators.min(1)]],

      // UI-only controls — not needed by the API, just used to auto-fill referenceId
      employeeId: [null],
      companyId: [null]
    }, { validators: this.dateRangeValidator });

    // Handle Employee/Company-specific behavior as soon as the module changes
    this.documentForm.get('moduleName')?.valueChanges.subscribe((module: string) => {
      this.onModuleChange(module);
    });

    // Auto-fill Reference ID as soon as an employee is selected from the dropdown
    this.documentForm.get('employeeId')?.valueChanges.subscribe((employeeId: number | null) => {
      if (employeeId) {
        this.documentForm.get('referenceId')?.setValue(employeeId, { emitEvent: false });
      }
    });

    // Auto-fill Reference ID as soon as a company is selected from the dropdown (same as Employee)
    this.documentForm.get('companyId')?.valueChanges.subscribe((companyId: number | null) => {
      if (companyId) {
        this.documentForm.get('referenceId')?.setValue(companyId, { emitEvent: false });
      }
    });

    // Clear the old file as soon as the Document Type changes — rules may differ for the new type
    this.documentForm.get('documentTypeId')?.valueChanges.subscribe(() => {
      if (this.selectedFile) {
        this.removeSelectedFile();
      }
    });
  }

  // ===================================================
  // FILE UPLOAD — dynamic validation based on Document Type
  // ===================================================

  // The full object of the currently selected Document Type (contains allowedExtensions, maxFileSizeMB)
  get selectedDocumentType(): DocumentTypesResponse | undefined {
    const typeId = this.documentForm?.get('documentTypeId')?.value;
    return this.documentTypes.find(t => t.documentTypeId === typeId);
  }

  // Splits a comma-separated string like ".pdf, .docx, .jpg" into a clean array
  get allowedExtensionsList(): string[] {
    const raw = this.selectedDocumentType?.allowedExtensions;
    if (!raw) return [];
    return raw.split(',')
      .map(ext => ext.trim().toLowerCase())
      .map(ext => (ext.startsWith('.') ? ext : '.' + ext))
      .filter(Boolean);
  }

  // Max size for the document type — if not set, any size is allowed (no limit)
  get maxFileSizeMB(): number | null {
    return this.selectedDocumentType?.maxFileSizeMB ?? null;
  }

  // Human-readable hint shown in the form, e.g. "Allowed: .pdf, .docx • Max size: 5 MB"
  get fileRulesHint(): string {
    if (!this.selectedDocumentType) {
      return 'Please select a Document Type first — its allowed file rules will appear here.';
    }
    const parts: string[] = [];
    if (this.allowedExtensionsList.length > 0) {
      parts.push(`Allowed: ${this.allowedExtensionsList.join(', ')}`);
    } else {
      parts.push('Allowed: any file type');
    }
    parts.push(this.maxFileSizeMB ? `Max size: ${this.maxFileSizeMB} MB` : 'Max size: no limit set');
    return parts.join(' • ');
  }

  // For the file <input accept="..."> — restricts the browser file-picker based on the
  // selected Document Type (e.g. PAN/Aadhar = images only, PDF for other types, etc.)
  // Nothing is restricted until a Document Type is selected — that must be chosen first.
  get acceptAttribute(): string {
    return this.allowedExtensionsList.length > 0 ? this.allowedExtensionsList.join(',') : '';
  }

  // ---------------------------------------------------
  // FILE URL / PREVIEW HELPERS
  // ---------------------------------------------------
  // Backend file-server base URL — where filePath is served from. Set your actual API/base URL here.
  readonly fileBaseUrl = 'https://localhost:7135/';

  // Builds the full file URL — used for the link/thumbnail in the table
  getFileUrl(filePath: string | null | undefined): string {
    if (!filePath) return '';
    return this.fileBaseUrl + filePath;
  }

  // Determines whether the extension is an image — if so, a thumbnail is shown in the table
  isImageFile(extension: string | null | undefined): boolean {
    if (!extension) return false;
    const ext = extension.toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
  }

  // Runs as soon as a file is selected from the file input
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError = '';

    if (!file) return;

    // 1. A Document Type must be selected first, otherwise the rules aren't known
    if (!this.selectedDocumentType) {
      this.fileError = 'Please select a Document Type first, then upload the file.';
      input.value = '';
      return;
    }

    // 2. Extension check — extract the file's extension and compare against the allowed list
    const dotIndex = file.name.lastIndexOf('.');
    const fileExt = dotIndex >= 0 ? file.name.substring(dotIndex).toLowerCase() : '';

    if (this.allowedExtensionsList.length > 0 && !this.allowedExtensionsList.includes(fileExt)) {
      this.fileError = `"${fileExt || 'no extension'}" is not allowed. Only these are allowed: ${this.allowedExtensionsList.join(', ')}`;
      input.value = '';
      return;
    }

    // 3. Size check — get the file size in KB and compare against the max limit
    const fileSizeKB = Math.ceil(file.size / 1024);
    const maxKB = this.maxFileSizeMB ? this.maxFileSizeMB * 1024 : null;

    if (maxKB && fileSizeKB > maxKB) {
      this.fileError = `File size is ${(fileSizeKB / 1024).toFixed(2)} MB, but "${this.selectedDocumentType.documentTypeName}" allows a max of ${this.maxFileSizeMB} MB.`;
      input.value = '';
      return;
    }

    // All checks passed — accept the file and auto-fill related fields
    this.selectedFile = file;
    this.documentForm.patchValue({
      originalFileName: file.name,
      fileExtension: fileExt,
      fileSizeKB: fileSizeKB
    });
    this.documentForm.get('originalFileName')?.markAsDirty();
    this.documentForm.get('fileExtension')?.markAsDirty();
    this.documentForm.get('fileSizeKB')?.markAsDirty();
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.fileError = '';
    this.documentForm.patchValue({
      originalFileName: this.existingFileName || '',
      fileExtension: '',
      fileSizeKB: null
    });
  }

  // Called from the Document Type dropdown's (change) event — same behavior as the
  // documentTypeId valueChanges subscription above (clearing the old file); kept here explicitly
  // because the HTML template now calls this directly via (change).
  onDocumentTypeChange(): void {
    if (this.selectedFile) {
      this.removeSelectedFile();
    }
  }

  // Converts bytes into a human-readable size string — used for the file preview card
  formatFileSize(bytes: number): string {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  // ===================================================
  // MODULE CHANGE — activate the respective picker when Employee/Company module is selected
  // ===================================================
  get isEmployeeModule(): boolean {
    return this.documentForm?.get('moduleName')?.value === 'Employee';
  }

  // getter for the Company module
  get isCompanyModule(): boolean {
    return this.documentForm?.get('moduleName')?.value === 'Company';
  }

  private onModuleChange(module: string): void {
    const employeeIdCtrl = this.documentForm.get('employeeId');
    const companyIdCtrl = this.documentForm.get('companyId');
    const referenceIdCtrl = this.documentForm.get('referenceId');

    // First reset both picker controls, then enable whichever one matches the selected module
    employeeIdCtrl?.clearValidators();
    employeeIdCtrl?.setValue(null, { emitEvent: false });
    employeeIdCtrl?.updateValueAndValidity({ emitEvent: false });

    companyIdCtrl?.clearValidators();
    companyIdCtrl?.setValue(null, { emitEvent: false });
    companyIdCtrl?.updateValueAndValidity({ emitEvent: false });

    if (module === 'Employee') {
      // Employee module: referenceId is no longer entered manually, it comes from the employee dropdown
      employeeIdCtrl?.setValidators([Validators.required]);
      employeeIdCtrl?.updateValueAndValidity({ emitEvent: false });
      referenceIdCtrl?.disable({ emitEvent: false });
    } else if (module === 'Company') {
      // Company module: referenceId is no longer entered manually, it comes from the company dropdown
      companyIdCtrl?.setValidators([Validators.required]);
      companyIdCtrl?.updateValueAndValidity({ emitEvent: false });
      referenceIdCtrl?.disable({ emitEvent: false });
    } else {
      // Any other module: referenceId goes back to manual entry
      referenceIdCtrl?.enable({ emitEvent: false });
    }
  }

  // ===================================================
  // CUSTOM VALIDATOR — Expiry Date must not be before Effective Date
  // ===================================================
  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const effectiveDate = group.get('effectiveDate')?.value;
    const expiryDate = group.get('expiryDate')?.value;

    if (effectiveDate && expiryDate && new Date(expiryDate) < new Date(effectiveDate)) {
      return { expiryBeforeEffective: true };
    }
    return null;
  }

  // ===================================================
  // TEMPLATE HELPERS — for validation
  // ===================================================
  isInvalid(controlName: string): boolean {
    const control = this.documentForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.documentForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.touched || control.dirty);
  }

  get showDateRangeError(): boolean {
    const effectiveDate = this.documentForm.get('effectiveDate');
    const expiryDate = this.documentForm.get('expiryDate');
    return this.documentForm.hasError('expiryBeforeEffective')
      && !!(effectiveDate?.touched || effectiveDate?.dirty || expiryDate?.touched || expiryDate?.dirty);
  }

  // ===================================================
  // LOAD DOCUMENTS
  // ===================================================
  loadDocuments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.documentsService.getAll().subscribe({
      next: (res: any) => {
        this.documents = res?.data || res || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.errorMessage = err?.error?.message || 'Failed to load documents.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================================================
  // LOAD DOCUMENT TYPES (for dropdown)
  // ===================================================
  loadDocumentTypes(): void {
    // false = only active document types (same getAll signature as DocumentTypesComponent)
    this.documentTypesService.getAll(false).subscribe({
      next: (res) => {
        this.documentTypes = res?.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load document types:', err);
        // Optional: a separate error message could be kept here too
      }
    });
  }

  // ===================================================
  // LOAD EMPLOYEES (for Employee-module picker)
  // ===================================================
  loadEmployees(): void {
    this.employeesLoading = true;
    this.employeesError = '';

    // Using getAll() — confirmed working in EmployeeMasterComponent.
    // (getAllForDropdown() may not be properly implemented in the backend / returns empty)
    this.employeeService.getAll().subscribe({
      next: (res: any) => {
        this.employees = res?.data ?? [];
        this.employeesLoading = false;

        if (this.employees.length === 0) {
          console.warn('Employees array came back empty — check the GetAll endpoint on the backend (no active employee record found).');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
        this.employeesError = err?.error?.title || err?.error?.message || 'Failed to load employees list.';
        this.employeesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================================================
  // LOAD COMPANIES (for Company-module picker)
  // ===================================================
  loadCompanies(): void {
    this.companiesLoading = true;
    this.companiesError = '';

    // NOTE: if CompanyService's method name or response shape differs,
    // adjust .getAll() and res?.data here accordingly.
    this.companyService.getAll().subscribe({
      next: (res: any) => {
        this.companies = res?.data ?? res ?? [];
        this.companiesLoading = false;

        if (this.companies.length === 0) {
          console.warn('Companies array came back empty — check the GetAll endpoint on the backend (no active company record found).');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load companies:', err);
        this.companiesError = err?.error?.title || err?.error?.message || 'Failed to load companies list.';
        this.companiesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================================================
  // HELPERS — for showing readable names instead of IDs in the table
  // ===================================================
  getDocumentTypeName(typeId: number): string {
    const type = this.documentTypes.find(t => t.documentTypeId === typeId);
    return type ? type.documentTypeName : (typeId?.toString() || '-');
  }

  // For Employee-module documents, shows the Employee Name instead of the Reference ID
  getEmployeeName(employeeId: number): string {
    const emp = this.employees.find(e => e.employeeID === employeeId);
    return emp ? this.getEmployeeDisplayName(emp) : employeeId?.toString();
  }

  // Employee's display name — name only, no code/id
  getEmployeeDisplayName(emp: EmployeeResponse): string {
    const fullName = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
    return fullName || emp.employeeCode || `Employee #${emp.employeeID}`;
  }

  // For Company-module documents, shows the Company Name instead of the Reference ID
  getCompanyName(companyId: number): string {
    const company = this.companies.find(c => c.companyID === companyId);
    return company ? this.getCompanyDisplayName(company) : companyId?.toString();
  }

  // Company's display name — name only
  getCompanyDisplayName(company: CompanyResponse): string {
    return company.companyName || `Company #${company.companyID}`;
  }

  // For the Reference column in the table — show the name based on module, otherwise the raw id
  getReferenceDisplay(doc: DocumentsResponse): string {
    if (doc.moduleName === 'Employee') {
      return this.getEmployeeName(doc.referenceId);
    }
    if (doc.moduleName === 'Company') {
      return this.getCompanyName(doc.referenceId);
    }
    return doc.referenceId?.toString();
  }

  // ===================================================
  // MODAL — ADD / EDIT
  // ===================================================
  openAddModal(): void {
    this.resetForm();
    this.selectedFile = null;
    this.fileError = '';
    this.existingFileName = null;
    this.isEdit = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.showModal = true;
  }

  openEditModal(doc: DocumentsResponse): void {
    this.documentForm.patchValue({
      // documentId (API response) -> documentID (form control) mapping fix
      documentID: doc.documentId,
      documentTypeId: doc.documentTypeId,
      documentTitle: doc.documentTitle,
      description: doc.description,
      moduleName: doc.moduleName,
      referenceId: doc.referenceId,
      originalFileName: doc.originalFileName,
      storedFileName: doc.storedFileName,
      filePath: doc.filePath,
      fileExtension: doc.fileExtension,
      fileSizeKB: doc.fileSizeKB,
      versionNo: doc.versionNo,
      effectiveDate: doc.effectiveDate ? doc.effectiveDate.substring(0, 10) : null,
      expiryDate: doc.expiryDate ? doc.expiryDate.substring(0, 10) : null,
      isConfidential: doc.isConfidential,
      status: doc.status,
      uploadedBy: doc.uploadedBy,
      // If it's the Employee module, referenceId IS the employee id — pre-select the dropdown
      employeeId: doc.moduleName === 'Employee' ? doc.referenceId : null,
      // If it's the Company module, referenceId IS the company id — pre-select the dropdown
      companyId: doc.moduleName === 'Company' ? doc.referenceId : null
    });

    // Based on moduleName, properly set the referenceId enable/disable and employeeId/companyId validator state
    this.onModuleChange(doc.moduleName);
    // After patchValue, referenceId might be disabled — re-confirm its value
    this.documentForm.get('referenceId')?.setValue(doc.referenceId, { emitEvent: false });

    // In edit mode, the existing file info is already in the form — no new file selected yet
    this.selectedFile = null;
    this.fileError = '';
    // Store the previously uploaded file's name to show in the preview card
    this.existingFileName = doc.originalFileName || null;

    this.isEdit = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) {
      return;
    }
    this.showModal = false;
    this.errorMessage = '';
    this.resetForm();
    this.selectedFile = null;
    this.fileError = '';
    this.existingFileName = null;
    this.isEdit = false;
  }

  // ===================================================
  // SAVE (Add / Update)
  // ===================================================
  submit(): void {
    if (this.fileError) {
      this.errorMessage = 'Please fix the file error before saving.';
      return;
    }

    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    // In add mode, a file is mandatory (in edit mode, the old file is already on the server)
    if (!this.isEdit && !this.selectedFile) {
      this.errorMessage = 'Please upload a file.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // getRawValue() — includes disabled controls too (e.g. referenceId when Employee/Company module is active)
    const rawValue = this.documentForm.getRawValue();
    // employeeId/companyId are UI-only helpers, not sent to the API
    const { employeeId, companyId, ...formValue } = rawValue;

    // ===================================================
    // ACTUAL FILE UPLOAD — using FormData (multipart/form-data) so the binary
    // file is included with the request all the way to the server/DB, not just the filename as text.
    //
    // IMPORTANT: DocumentsService.add()/.update() previously accepted DocumentsRequest (JSON).
    // To send FormData, both these methods in the service also need to accept multipart
    // (don't set the Content-Type header yourself — Angular HttpClient will detect the FormData
    // and set it automatically along with the boundary).
    // If your DocumentsService currently expects JSON, share that file too and its
    // signature can be updated to match FormData.
    // ===================================================
    const formData = new FormData();

    Object.keys(formValue).forEach((key) => {
      const value = (formValue as Record<string, any>)[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value instanceof Date ? value.toISOString() : String(value));
      }
    });

    // Only append the file if a new one was selected — in edit mode, if the file wasn't replaced,
    // the old file on the server stays as is
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    const request$ = this.isEdit
      ? this.documentsService.update(formData)
      : this.documentsService.add(formData);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.successMessage = this.isEdit ?'Document updated successfully.' : 'Document added successfully.';
        this.resetForm();
        this.selectedFile = null;
        this.existingFileName = null;
        this.isEdit = false;
        this.loadDocuments();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(this.isEdit ? 'Update failed:' : 'Add failed:', err);
        this.errorMessage = err?.error?.message || (this.isEdit
          ? 'Failed to update document. Please try again.'
          : 'Failed to add document. Please try again.');
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================================================
  // DELETE
  // ===================================================
  deleteDocument(doc: DocumentsResponse): void {
    const confirmed = window.confirm(`Delete document "${doc.documentTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingId = doc.documentId;
    this.cdr.detectChanges();

    this.documentsService.delete(doc.documentId).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage = 'Document deleted successfully.';
        this.loadDocuments();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.deletingId = null;
        this.errorMessage = err?.error?.message || `Failed to delete "${doc.documentTitle}".`;
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.documentForm.reset({
      documentID: 0,
      documentTypeId: 0,
      documentTitle: '',
      description: '',
      moduleName: '',
      referenceId: null,
      originalFileName: '',
      storedFileName: '',
      filePath: '',
      fileExtension: '',
      fileSizeKB: null,
      versionNo: null,
      effectiveDate: null,
      expiryDate: null,
      isConfidential: false,
      status: 'Active',
      uploadedBy: null,
      employeeId: null,
      companyId: null
    });
  }
}
