import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CompanyRequest } from '../../../../app/shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../../../app/shared/models/companylist/CompanyResponse';
import { EmployerService } from '../../../../app/core/services/company.service';
import { UiAlertComponent, UiButtonComponent, UiPageHeaderComponent } from '../../../shared/ui';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UiPageHeaderComponent, UiAlertComponent, UiButtonComponent],
  templateUrl: './CompanyList.html',
  styleUrl: './Companylist.css'
})
export class CompanyList implements OnInit {
  // Base URL where uploaded files are served from (wwwroot root of the API)
  private readonly fileBaseUrl = 'https://localhost:7135';

  companies: CompanyResponse[] = [];
  filteredCompanies: CompanyResponse[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';
  searchText = '';

  // ---------- Modal state ----------
  showModal = false;
  isEditMode = false;
  saving = false;
  formError = '';

  // Per-field validation messages, shown directly under each input.
  fieldErrors: {
    companyName?: string;
    location?: string;
    contactPersonName?: string;
    contactNumber?: string;
    dateRange?: string;
    companyLogo?: string;
    companyImage?: string;
  } = {};

  private readonly maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
  private readonly contactNumberPattern = /^[0-9+\-\s()]{7,15}$/;

  // Existing file URLs shown while editing (until a new file is chosen)
  editingLogoUrl: string | null = null;
  editingImageUrl: string | null = null;

  formModel: CompanyRequest = this.emptyForm();

  constructor(
    private employerService: EmployerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCompanies();
  }

  private emptyForm(): CompanyRequest {
    return {
      companyID: null,
      companyName: '',
      fromDate: null,
      toDate: null,
      location: '',
      contactPersonName: '',
      contactNumber: '',
      companyLogo: null,
      companyImage: null
    };
  }

  // Builds a full URL for a stored file path returned by the API
  getFileUrl(path: string | null | undefined): string {
    if (!path) return '';
    return `${this.fileBaseUrl}/${path.replace(/^\/+/, '')}`;
  }

  // Shows a success banner for a few seconds, then auto-clears it.
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  // Extracts the most useful message out of an HttpErrorResponse.
  // Backend may return { message: "..." }, a plain string body, or
  // (worst case) nothing useful — in which case we fall back to a
  // generic message rather than guessing at the cause.
  private extractErrorMessage(err: any, fallback: string): string {
    const backendMessage =
      err?.error?.message ??
      (typeof err?.error === 'string' ? err.error : null) ??
      err?.message;

    if (backendMessage && typeof backendMessage === 'string') {
      // Make the common FK-violation message human-readable instead of
      // showing the raw SQL exception text to the user.
      if (backendMessage.includes('REFERENCE constraint') || backendMessage.includes('FOREIGN KEY')) {
        return 'This company is still linked to other records (employees, designations, shifts, etc.) and cannot be permanently deleted. Please reassign or remove those records first, or use a soft delete instead.';
      }
      return backendMessage;
    }

    return fallback;
  }

  // ===================================================
  // LOAD
  // ===================================================
  loadCompanies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.employerService.getAll().subscribe({
      next: (res) => {
        this.companies = res.data ?? [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Failed to load companies.');
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const term = this.searchText.trim().toLowerCase();
    this.filteredCompanies = !term
      ? [...this.companies]
      : this.companies.filter(c =>
        (c.companyName ?? '').toLowerCase().includes(term) ||
        (c.location ?? '').toLowerCase().includes(term) ||
        (c.contactPersonName ?? '').toLowerCase().includes(term)
      );
  }

  // ===================================================
  // MODAL — ADD / EDIT
  // ===================================================
  openAddModal(): void {
    this.isEditMode = false;
    this.formModel = this.emptyForm();
    this.editingLogoUrl = null;
    this.editingImageUrl = null;
    this.formError = '';
    this.fieldErrors = {};
    this.showModal = true;
  }

  openEditModal(company: CompanyResponse): void {
    this.isEditMode = true;
    this.formModel = {
      companyID: company.companyID,
      companyName: company.companyName,
      fromDate: company.fromDate ? company.fromDate.substring(0, 10) : null,
      toDate: company.toDate ? company.toDate.substring(0, 10) : null,
      location: company.location,
      contactPersonName: company.contactPersonName,
      contactNumber: company.contactNumber,
      companyLogo: null,
      companyImage: null
    };
    this.editingLogoUrl = this.getFileUrl(company.companyLogo) || null;
    this.editingImageUrl = this.getFileUrl(company.companyImage) || null;
    this.formError = '';
    this.fieldErrors = {};
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
    this.fieldErrors = {};
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fieldErrors.companyLogo = this.validateImageFile(file);
    this.formModel.companyLogo = this.fieldErrors.companyLogo ? null : file;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fieldErrors.companyImage = this.validateImageFile(file);
    this.formModel.companyImage = this.fieldErrors.companyImage ? null : file;
  }

  // Returns an error message if the file isn't a valid image within the
  // size limit, or undefined if it's fine.
  private validateImageFile(file: File | null): string | undefined {
    if (!file) return undefined;
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed.';
    }
    if (file.size > this.maxFileSizeBytes) {
      return 'Image must be 5 MB or smaller.';
    }
    return undefined;
  }

  // Validates the whole form. Populates fieldErrors and returns true
  // only when every field is valid.
  private validateForm(): boolean {
    this.fieldErrors = {};

    const name = (this.formModel.companyName ?? '').trim();
    if (!name) {
      this.fieldErrors.companyName = 'Company name is required.';
    } else if (name.length < 2) {
      this.fieldErrors.companyName = 'Company name must be at least 2 characters.';
    } else if (name.length > 150) {
      this.fieldErrors.companyName = 'Company name must be 150 characters or fewer.';
    }

    if (this.formModel.location && this.formModel.location.length > 100) {
      this.fieldErrors.location = 'Location must be 100 characters or fewer.';
    }

    if (this.formModel.contactPersonName && this.formModel.contactPersonName.length > 100) {
      this.fieldErrors.contactPersonName = 'Contact person must be 100 characters or fewer.';
    }

    const contact = (this.formModel.contactNumber ?? '').trim();
    if (contact && !this.contactNumberPattern.test(contact)) {
      this.fieldErrors.contactNumber = 'Enter a valid contact number (7-15 digits, may include +, -, spaces).';
    }

    if (this.formModel.fromDate && this.formModel.toDate) {
      const from = new Date(this.formModel.fromDate);
      const to = new Date(this.formModel.toDate);
      if (from > to) {
        this.fieldErrors.dateRange = 'From date must be on or before the to date.';
      }
    }

    // File errors, if any, were already captured on selection.
    return Object.values(this.fieldErrors).every(v => !v);
  }

  saveCompany(): void {
    this.formError = '';

    if (!this.validateForm()) {
      this.formError = 'Please fix the highlighted fields before saving.';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.formModel.companyID) {
      this.employerService.update(this.formModel.companyID, this.formModel).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadCompanies();
          this.showSuccess(`"${this.formModel.companyName}" updated successfully.`);
        },
        error: (err) => {
          this.saving = false;
          this.formError = this.extractErrorMessage(err, 'Failed to update company.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.employerService.add(this.formModel).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadCompanies();
          this.showSuccess(`"${this.formModel.companyName}" added successfully.`);
        },
        error: (err) => {
          this.saving = false;
          this.formError = this.extractErrorMessage(err, 'Failed to add company.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ===================================================
  // DELETE
  // ===================================================
  deletingId: number | null = null;

  deleteCompany(company: CompanyResponse): void {
    const confirmed = window.confirm(`Delete company "${company.companyName}"? This action cannot be undone.`);
    if (!confirmed) return;

    this.deletingId = company.companyID;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.employerService.delete(company.companyID, true).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadCompanies();
        this.showSuccess(`"${company.companyName}" deleted successfully.`);
      },
      error: (err) => {
        this.deletingId = null;
        this.errorMessage = this.extractErrorMessage(err, `Failed to delete "${company.companyName}".`);
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }
}
