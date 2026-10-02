import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { read, utils, writeFile, WorkBook, WorkSheet } from 'xlsx';

import { EmployeeService } from '@core/services/employee.service';
import { EmployerService } from '@core/services/company.service';
import { DepartmentService } from '@core/services/Department.Service';
import { DesignationService } from '@core/services/designation.service';
import { ShiftService } from '@core/services/shift.service';
import { FrontendPermissionService } from '@core/services/frontend-permission.service';
import { AuthService } from '@core/services/Auth.service';
import { EmployeeRequest } from '@shared/models/employee/employee-request';
import { EmployeeResponse } from '@shared/models/employee/employee-response';
import {
  EMPLOYEE_REPORT_COLUMNS,
  EMPLOYEE_SHEET_HEADERS,
  EMPLOYEE_STATUS_OPTIONS,
  GENDER_OPTIONS,
  SNO_COLUMN_LABEL,
  EmployeeColumn,
} from '@shared/constants/employee-report-columns';
import { normalizeDateValue, validateEmployee } from '@shared/validators/employee-validators';

export interface EmployeeRow {
  rowNum: number;
  /** Serial number taken from the sheet's SNO column (falls back to the row position). */
  sno: number | string;
  data: Record<string, any>;
  mapped: EmployeeRequest;
  valid: boolean;
  errors: string[];
  /** Column key -> error message, used to highlight the exact offending cell. */
  fieldErrors: Record<string, string>;
}

interface DropdownItem {
  id: number;
  name: string;
}

@Component({
  selector: 'app-employee-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-import.component.html',
  styleUrls: ['./employee-import.component.css'],
})
export class EmployeeImportComponent implements OnInit, OnDestroy {
  /** Step 1 = upload, 2 = preview/validate, 3 = import results */
  currentStep = 1;

  // ═══════════════════════════════════════════════════════
  // Columns — shared with the report page so the sheet always
  // has exactly the same columns, in the same order.
  // ═══════════════════════════════════════════════════════
  readonly importColumns: EmployeeColumn[] = EMPLOYEE_REPORT_COLUMNS;
  readonly sheetHeaders: string[] = EMPLOYEE_SHEET_HEADERS;
  readonly statusOptions = EMPLOYEE_STATUS_OPTIONS;
  readonly genderOptions = GENDER_OPTIONS;
  readonly snoLabel = SNO_COLUMN_LABEL;

  private columnByKey = new Map<string, EmployeeColumn>(
    EMPLOYEE_REPORT_COLUMNS.map((c) => [c.key, c]),
  );

  // ── Master data loaded dynamically from database (no hardcoding) ──
  companies: DropdownItem[] = [];
  departments: DropdownItem[] = [];
  designations: DropdownItem[] = [];
  shifts: DropdownItem[] = [];
  existingEmployees: EmployeeResponse[] = [];
  existingCodes = new Set<string>();
  existingEmails = new Set<string>();

  selectedDefaultCompanyId: number | null = null;
  loadingMasters = false;

  // ── File upload state ──
  selectedFile: File | null = null;
  uploadError = '';
  uploadSuccess = '';
  dragOver = false;

  // ── Parsed data ──
  rows: EmployeeRow[] = [];
  mappedHeaders: { key: string; label: string }[] = [];
  unmappedHeaders: string[] = [];
  missingRequiredHeaders: { key: string; label: string }[] = [];

  // ── Preview filtering ──
  previewFilter: 'all' | 'valid' | 'invalid' = 'all';
  previewSearch = '';

  // ── Import state ──
  importing = false;
  importProgress = 0;
  importTotal = 0;
  importResults = { success: 0, failed: 0, errors: [] as string[] };

  // ── Auto redirect countdown timer ──
  redirectCountdown: number | null = null;
  private countdownInterval: any = null;

  // ── Permissions ──
  canImport = true;

  constructor(
    private employeeService: EmployeeService,
    private companyService: EmployerService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private shiftService: ShiftService,
    private frontendPerm: FrontendPermissionService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
    this.loadMasters();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  loadPermissions(): void {
    const roleId = this.frontendPerm.getCurrentRoleId();
    if (!roleId || roleId === 1) return;
    this.canImport = this.frontendPerm.canAddByUrl('/Recruiter/employee-master');
    this.cdr.detectChanges();
  }

  loadMasters(): void {
    this.loadingMasters = true;

    // 1. Companies
    this.companyService.getAll().subscribe({
      next: (res: any) => {
        this.companies = (res.data ?? []).map((c: any) => ({
          id: c.companyID,
          name: c.companyName,
        }));
        const tokenCompany = this.auth.getCompanyId();
        if (tokenCompany) {
          this.companies = this.companies.filter(c => c.id === tokenCompany);
          this.selectedDefaultCompanyId = tokenCompany;
        } else if (this.companies.length > 0 && !this.selectedDefaultCompanyId) {
          this.selectedDefaultCompanyId = this.companies[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading companies:', err),
    });

    // 2. Departments
    this.departmentService.getAll().subscribe({
      next: (res: any) => {
        this.departments = (Array.isArray(res) ? res : (res.data ?? [])).map((d: any) => ({
          id: d.departmentID,
          name: d.departmentName,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading departments:', err),
    });

    // 3. Designations
    this.designationService.getAll().subscribe({
      next: (res: any) => {
        this.designations = (Array.isArray(res) ? res : (res.data ?? [])).map((d: any) => ({
          id: d.designationID,
          name: d.designationName,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading designations:', err),
    });

    // 4. Shifts
    this.shiftService.getAll().subscribe({
      next: (res: any) => {
        this.shifts = (Array.isArray(res) ? res : (res.data ?? [])).map((s: any) => ({
          id: s.shiftID,
          name: s.shiftName,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading shifts:', err),
    });

    // 5. Existing Employees (duplicate checks + manager matching)
    this.employeeService.getAll().subscribe({
      next: (res: EmployeeResponse[]) => {
        this.existingEmployees = res ?? [];
        this.existingCodes = new Set(
          this.existingEmployees
            .map((e) => (e.employeeCode || '').trim().toLowerCase())
            .filter((c) => !!c),
        );
        this.existingEmails = new Set(
          this.existingEmployees
            .map((e) => (e.email || '').trim().toLowerCase())
            .filter((c) => !!c),
        );
        this.loadingMasters = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingMasters = false;
        console.error('Error loading existing employees:', err);
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  // Step 1 — Download template (CSV or Excel)
  // Sheet layout = SNO + every report column, in report order.
  // ═══════════════════════════════════════════════════════

  downloadTemplate(format: 'csv' | 'xlsx'): void {
    const headers = this.sheetHeaders;
    const sampleRow = [
      1,
      ...this.importColumns.map((c) => this.sampleValueFor(c)),
    ];

    const wsData = [headers, sampleRow];
    const ws: WorkSheet = utils.aoa_to_sheet(wsData);

    // Keep long text columns readable when opened in Excel.
    ws['!cols'] = wsData[0].map((h: string) => ({ wch: Math.max(12, String(h).length + 2) }));

    if (format === 'xlsx') {
      const wb: WorkBook = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Employee Import Template');
      writeFile(wb, 'Employee_Import_Template.xlsx');
    } else {
      const csv = utils.sheet_to_csv(ws);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Employee_Import_Template.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  private sampleValueFor(col: EmployeeColumn): any {
    if (col.key === 'company' && this.companies.length > 0) return this.companies[0].name;
    if (col.key === 'department' && this.departments.length > 0) return this.departments[0].name;
    if (col.key === 'designation' && this.designations.length > 0) return this.designations[0].name;
    if (col.key === 'shiftType' && this.shifts.length > 0) return this.shifts[0].name;
    if (col.key === 'salary') return Number(col.sample);
    return col.sample;
  }

  // ═══════════════════════════════════════════════════════
  // Step 1 — File upload / parse
  // ═══════════════════════════════════════════════════════

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.processFile(file);
    input.value = '';
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  private async processFile(file: File): Promise<void> {
    this.uploadError = '';
    this.uploadSuccess = '';
    this.selectedFile = file;

    const validExts = ['.csv', '.xls', '.xlsx'];
    const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >> 0) + 2).toLowerCase();

    if (!validExts.includes('.' + ext)) {
      this.uploadError = `Unsupported file type. Please upload a CSV, XLS, or XLSX spreadsheet.`;
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.uploadError = `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum 10 MB allowed.`;
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook: WorkBook = read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        this.uploadError = 'The uploaded workbook contains no sheets.';
        this.rows = [];
        this.cdr.detectChanges();
        return;
      }

      const worksheet: WorkSheet = workbook.Sheets[sheetName];
      const json: any[] = utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (!json || json.length === 0) {
        this.uploadError = 'No data rows found in the uploaded file.';
        this.rows = [];
        this.cdr.detectChanges();
        return;
      }

      this.parseRows(json);

      if (this.missingRequiredHeaders.length > 0) {
        this.uploadError =
          `Missing required column(s): ${this.missingRequiredHeaders.map((c) => c.label).join(', ')}. ` +
          `Download the template and keep the same column names/positions.`;
      }

      this.uploadSuccess = `Successfully parsed ${json.length} row(s) from "${file.name}".`;
      this.currentStep = 2;
      this.previewFilter = 'all';
      this.cdr.detectChanges();
    } catch (err: any) {
      this.uploadError = `Failed to parse file: ${err?.message || 'Invalid spreadsheet structure'}`;
      this.rows = [];
      this.cdr.detectChanges();
    }
  }

  // ═══════════════════════════════════════════════════════
  // Step 2 — Column mapping + validation
  // ═══════════════════════════════════════════════════════

  private normalizeHeader(header: string): string {
    return String(header ?? '').trim().toLowerCase().replace(/[\s\-_'"().]/g, '');
  }

  private isSnoHeader(header: string): boolean {
    const norm = this.normalizeHeader(header);
    return norm === 'sno' || norm === 'srno' || norm === 'serialno' || norm === 'serialnumber' || norm === 'snumber';
  }

  private findColumnForHeader(rawHeader: string): EmployeeColumn | null {
    const norm = this.normalizeHeader(rawHeader);
    if (!norm) return null;
    return (
      this.importColumns.find((c) => {
        if (this.normalizeHeader(c.key) === norm) return true;
        if (this.normalizeHeader(c.label) === norm) return true;
        return c.aliases.some((alias) => this.normalizeHeader(alias) === norm);
      }) || null
    );
  }

  private parseRows(rawRows: Record<string, any>[]): void {
    this.mappedHeaders = [];
    this.unmappedHeaders = [];
    this.missingRequiredHeaders = [];
    this.rows = [];

    const rawHeaders = Object.keys(rawRows[0] || {});

    // ── 1. Match every header by name ──
    const claimed = new Set<string>();
    const headerMap: { csvHeader: string; col: EmployeeColumn | null }[] = rawHeaders.map((rawH) => {
      if (this.isSnoHeader(rawH)) return { csvHeader: rawH, col: null };
      const col = this.findColumnForHeader(rawH);
      if (col) claimed.add(col.key);
      return { csvHeader: rawH, col };
    });

    // ── 2. Positional fallback: a header we could not read by name is
    //       matched to the report column that sits in the same column
    //       position in the template, provided nothing else took it. ──
    headerMap.forEach((m, idx) => {
      if (m.col) return;
      const expectedKey = this.columnKeyForSheetIndex(idx);
      if (!expectedKey) return;
      if (claimed.has(expectedKey)) return;
      const col = this.columnByKey.get(expectedKey);
      if (!col) return;
      m.col = col;
      claimed.add(expectedKey);
    });

    this.mappedHeaders = headerMap
      .filter((m) => m.col !== null)
      .map((m) => ({ key: m.col!.key, label: m.col!.label }));

    this.unmappedHeaders = headerMap.filter((m) => m.col === null).map((m) => m.csvHeader);

    this.missingRequiredHeaders = this.importColumns
      .filter((c) => c.required && !claimed.has(c.key))
      .map((c) => ({ key: c.key, label: c.label }));

    const snoIndex = rawHeaders.findIndex((h) => this.isSnoHeader(h));

    const inMemoryCodeSet = new Set<string>();
    const inMemoryEmailSet = new Set<string>();

    this.rows = rawRows.map((rawRow, idx) => {
      // ── Collect the raw sheet values, keyed by report column key ──
      const data: Record<string, any> = {};
      headerMap.forEach((m) => {
        if (m.col) {
          data[m.col.key] = rawRow[m.csvHeader];
        }
      });

      const raw = (key: string): string => String(data[key] ?? '').trim();

      // A blank Company column falls back to the company chosen on Step 1.
      if (!raw('company') && this.selectedDefaultCompanyId) {
        const fallback = this.companies.find((c) => c.id === this.selectedDefaultCompanyId);
        if (fallback) data['company'] = fallback.name;
      }

      // ── In-file duplicates (sheet-level rules, not part of the shared set) ──
      const extraPairs: [string, string][] = [];
      const employeeCode = raw('employeeCode');
      if (employeeCode) {
        const lower = employeeCode.toLowerCase();
        if (inMemoryCodeSet.has(lower)) {
          extraPairs.push(['employeeCode', `Duplicate Employee Code "${employeeCode}" in this file`]);
        } else {
          inMemoryCodeSet.add(lower);
        }
      }
      const email = raw('email');
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const lower = email.toLowerCase();
        if (inMemoryEmailSet.has(lower)) {
          extraPairs.push(['email', `Duplicate Email "${email}" in this file`]);
        } else {
          inMemoryEmailSet.add(lower);
        }
      }

      // ═══════════════════════════════════════════════════
      // SAME validation as the Employee Master add/edit form
      // ═══════════════════════════════════════════════════
      const result = validateEmployee(data, {
        resolveLookups: true,
        companies: this.companies,
        departments: this.departments,
        designations: this.designations,
        shifts: this.shifts,
        employees: this.existingEmployees,
        existingCodes: this.existingCodes,
        existingEmails: this.existingEmails,
      });

      const fieldErrors: Record<string, string> = {};
      const errors: string[] = [];
      const addError = (key: string, message: string): void => {
        errors.push(message);
        if (!fieldErrors[key]) fieldErrors[key] = message;
      };
      for (const [key, message] of extraPairs) addError(key, message);
      for (const message of result.messages) {
        addError(this.fieldKeyForMessage(message), message);
      }

      // ── Resolve lookups to ids (names were already validated above) ──
      const companyMatch = this.companies.find(
        (c) => c.name.toLowerCase() === raw('company').toLowerCase() || String(c.id) === raw('company'),
      );
      const companyID = companyMatch?.id ?? this.selectedDefaultCompanyId ?? undefined;

      const canonical = (key: string, list: DropdownItem[]): string | undefined => {
        const value = raw(key);
        if (!value) return undefined;
        return list.find((item) => item.name.toLowerCase() === value.toLowerCase() || String(item.id) === value)?.name;
      };

      const department = canonical('department', this.departments);
      const designation = canonical('designation', this.designations);
      const shiftType = canonical('shiftType', this.shifts);

      const employeeIdFor = (key: string): number | undefined => {
        const value = raw(key);
        if (!value) return undefined;
        return this.existingEmployees.find(
          (e) =>
            (e.employeeCode || '').toLowerCase() === value.toLowerCase() ||
            `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim().toLowerCase() === value.toLowerCase() ||
            (e.employeeName || '').toLowerCase() === value.toLowerCase() ||
            String(e.employeeID) === value,
        )?.employeeID;
      };

      const managerID = employeeIdFor('manager');
      const reportingManagerID = employeeIdFor('reportingManager');

      // ── Normalised values ──
      const dateOfBirth = normalizeDateValue(data['dateOfBirth']);
      const dateOfJoining = normalizeDateValue(data['dateOfJoining']) ?? this.getTodayDate();
      const probationEndDate = normalizeDateValue(data['probationEndDate']);
      const confirmationDate = normalizeDateValue(data['confirmationDate']);
      const exitDate = normalizeDateValue(data['exitDate']);

      const genderMatch = GENDER_OPTIONS.find((g) => g.toLowerCase() === raw('gender').toLowerCase());
      const gender = genderMatch ?? raw('gender');

      const statusMatch = EMPLOYEE_STATUS_OPTIONS.find((s) => s.toLowerCase() === raw('employeeStatus').toLowerCase());
      const employeeStatus = statusMatch ?? raw('employeeStatus') ?? 'Active';
      const isActive = employeeStatus.toLowerCase() === 'active';

      const salaryNum = raw('salary') ? Number(raw('salary').replace(/[$,\s]/g, '')) : NaN;
      const salary = isNaN(salaryNum) ? undefined : salaryNum;

      const mapped: EmployeeRequest = {
        employeeCode,
        firstName: raw('firstName'),
        lastName: raw('lastName'),
        email,
        phone: raw('phone') || undefined,
        alternatePhone: raw('alternatePhone') || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        dateOfJoining: dateOfJoining || this.getTodayDate(),
        companyID: companyID || undefined,
        department: department || undefined,
        designation: designation || undefined,
        shiftType: shiftType || undefined,
        salary: salary || undefined,
        managerID: managerID || undefined,
        reportingManagerID: reportingManagerID || undefined,
        employmentType: raw('employmentType') || undefined,
        workLocation: raw('workLocation') || undefined,
        maritalStatus: raw('maritalStatus') || undefined,
        bloodGroup: raw('bloodGroup') || undefined,
        nationality: raw('nationality') || undefined,
        fatherName: raw('fatherName') || undefined,
        motherName: raw('motherName') || undefined,
        highestQualification: raw('highestQualification') || undefined,
        aadharNumber: raw('aadharNumber') || undefined,
        panNumber: raw('panNumber') || undefined,
        passportNumber: raw('passportNumber') || undefined,
        currentAddress: raw('currentAddress') || undefined,
        permanentAddress: raw('permanentAddress') || undefined,
        city: raw('city') || undefined,
        state: raw('state') || undefined,
        country: raw('country') || undefined,
        pinCode: raw('pinCode') || undefined,
        emergencyContactName: raw('emergencyContactName') || undefined,
        emergencyContactPhone: raw('emergencyContactPhone') || undefined,
        emergencyContactRelation: raw('emergencyContactRelation') || undefined,
        probationEndDate: probationEndDate || undefined,
        confirmationDate: confirmationDate || undefined,
        exitDate: exitDate || undefined,
        exitReason: raw('exitReason') || undefined,
        employeeStatus,
        bankName: raw('bankName') || undefined,
        bankAccountNumber: raw('bankAccountNumber') || undefined,
        ifscCode: raw('ifscCode') || undefined,
        uan: raw('uan') || undefined,
        pfNumber: raw('pfNumber') || undefined,
        esicNumber: raw('esicNumber') || undefined,
        isActive,
      };

      return {
        rowNum: idx + 2, // row 1 is the header
        sno: snoIndex >= 0 ? rawRow[rawHeaders[snoIndex]] : idx + 1,
        data,
        mapped,
        valid: errors.length === 0,
        errors,
        fieldErrors,
      };
    });
  }

  /** Sheet index (0-based, SNO included) -> report column key. */
  private columnKeyForSheetIndex(index: number): string | null {
    return index === 0 ? null : (this.importColumns[index - 1]?.key ?? null);
  }

  /**
   * Recovers the field key from a shared-validator message so the offending
   * cell can be highlighted. The shared rules all start with the field label
   * (e.g. "Email is required", "Status \"X\" is invalid..."), so matching the
   * label prefix is enough.
   */
  private fieldKeyForMessage(message: string): string {
    const match = this.importColumns.find((col) => message.startsWith(`${col.label} `));
    return match?.key ?? '_row';
  }

  private getTodayDate(): string {
    return new Date().toISOString().substring(0, 10);
  }

  get validRows(): EmployeeRow[] {
    return this.rows.filter((r) => r.valid);
  }

  get invalidRows(): EmployeeRow[] {
    return this.rows.filter((r) => !r.valid);
  }

  get filteredDisplayRows(): EmployeeRow[] {
    let list = this.rows;
    if (this.previewFilter === 'valid') {
      list = this.validRows;
    } else if (this.previewFilter === 'invalid') {
      list = this.invalidRows;
    }

    if (!this.previewSearch.trim()) return list;

    const term = this.previewSearch.toLowerCase().trim();
    return list.filter((r) => {
      const code = (r.mapped.employeeCode || '').toLowerCase();
      const name = `${r.mapped.firstName || ''} ${r.mapped.lastName || ''}`.toLowerCase();
      const email = (r.mapped.email || '').toLowerCase();
      const dept = (r.mapped.department || '').toLowerCase();
      return code.includes(term) || name.includes(term) || email.includes(term) || dept.includes(term);
    });
  }

  /** Renders a preview cell using the same display rules as the report page. */
  displayCellValue(row: EmployeeRow, colKey: string): string {
    const col = this.columnByKey.get(colKey);
    const resolve = col?.resolve ?? 'none';

    if (resolve === 'company') {
      if (!row.mapped.companyID) return '-';
      const found = this.companies.find((c) => c.id === row.mapped.companyID);
      return found ? found.name : `Company #${row.mapped.companyID}`;
    }

    if (resolve === 'manager' || resolve === 'reportingManager') {
      const id = resolve === 'manager' ? row.mapped.managerID : row.mapped.reportingManagerID;
      if (!id) return '-';
      const found = this.existingEmployees.find((e) => e.employeeID === id);
      return found ? `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim() : `#${id}`;
    }

    if (colKey === 'isActive') {
      return row.mapped.isActive ? 'Yes' : 'No';
    }

    const val = (row.mapped as any)[colKey];
    if (val === undefined || val === null || val === '') return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  }

  hasCellError(row: EmployeeRow, colKey: string): boolean {
    return !!row.fieldErrors[colKey];
  }

  get missingRequiredHeaderLabels(): string {
    return this.missingRequiredHeaders.map((c) => c.label).join(', ');
  }

  cellErrorFor(row: EmployeeRow, colKey: string): string {
    return row.fieldErrors[colKey] ?? '';
  }

  // ═══════════════════════════════════════════════════════
  // Step 2 → Step 3 — Import / Save to database
  // ═══════════════════════════════════════════════════════

  importEmployees(): void {
    if (!this.canImport) return;

    const valid = this.validRows;
    if (valid.length === 0) {
      this.uploadError = 'No valid rows to import. Please review and fix the invalid rows in your file.';
      this.cdr.detectChanges();
      return;
    }

    const skippedCount = this.invalidRows.length;
    const confirmMsg =
      skippedCount > 0
        ? `Import ${valid.length} valid employee(s)?\n\nNote: ${skippedCount} invalid row(s) will be skipped.`
        : `Import ${valid.length} employee(s) into the system?`;

    if (!confirm(confirmMsg)) return;

    this.importing = true;
    this.currentStep = 3;
    this.importProgress = 0;
    this.importTotal = valid.length;
    this.importResults = { success: 0, failed: 0, errors: [] };
    this.uploadError = '';
    this.uploadSuccess = '';

    this.processBatch(valid, 0);
  }

  private processBatch(rows: EmployeeRow[], index: number): void {
    if (index >= rows.length) {
      this.onImportComplete();
      return;
    }

    const row = rows[index];
    const payload = { ...row.mapped };

    this.employeeService.add(payload).subscribe({
      next: () => {
        this.importResults.success++;
        this.importProgress = index + 1;
        this.cdr.detectChanges();
        this.processBatch(rows, index + 1);
      },
      error: (err: any) => {
        this.importResults.failed++;
        const empCode = row.mapped.employeeCode || `Row ${row.rowNum}`;
        const msg = err?.error?.message || err?.message || 'Server error while saving employee';
        this.importResults.errors.push(`Employee "${empCode}": ${msg}`);
        this.importProgress = index + 1;
        this.cdr.detectChanges();
        this.processBatch(rows, index + 1);
      },
    });
  }

  private onImportComplete(): void {
    this.importing = false;
    // The report page listens for this and refreshes its table in place.
    window.dispatchEvent(new CustomEvent('employeeListChanged'));

    if (this.importResults.failed === 0 && this.importResults.success > 0) {
      this.startRedirectCountdown();
    }

    this.cdr.detectChanges();
  }

  private startRedirectCountdown(): void {
    this.redirectCountdown = 4;
    this.countdownInterval = setInterval(() => {
      if (this.redirectCountdown !== null && this.redirectCountdown > 1) {
        this.redirectCountdown--;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.goToEmployeeTable();
      }
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════

  backToUpload(): void {
    this.currentStep = 1;
    this.uploadError = '';
    this.uploadSuccess = '';
    this.cdr.detectChanges();
  }

  resetAndImportMore(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.redirectCountdown = null;
    this.currentStep = 1;
    this.selectedFile = null;
    this.rows = [];
    this.mappedHeaders = [];
    this.unmappedHeaders = [];
    this.missingRequiredHeaders = [];
    this.uploadError = '';
    this.uploadSuccess = '';
    this.importResults = { success: 0, failed: 0, errors: [] };
    this.loadMasters(); // refresh existing employee list and codes
    this.cdr.detectChanges();
  }

  goToEmployeeTable(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.router.navigate(['/Recruiter/Report']);
  }

  goToEmployeeMaster(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.router.navigate(['/Recruiter/employee-master']);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  progressPercent(): number {
    if (this.importTotal === 0) return 0;
    return Math.round((this.importProgress / this.importTotal) * 100);
  }
}
