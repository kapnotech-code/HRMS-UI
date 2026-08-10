import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CompanyRequest } from '../../../../app/shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../../../app/shared/models/companylist/CompanyResponse';
import { EmployerService } from '../../../../app/core/services/company.service';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './CompanyList.html',
  styleUrl: './CompanyList.css'
})
export class CompanyList implements OnInit {
  // Base URL where uploaded files are served from (wwwroot root of the API)
  private readonly fileBaseUrl = 'https://localhost:7135';

  companies: CompanyResponse[] = [];
  filteredCompanies: CompanyResponse[] = [];

  loading = false;
  errorMessage = '';
  searchText = '';

  // ---------- Modal state ----------
  showModal = false;
  isEditMode = false;
  saving = false;
  formError = '';

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
      error: () => {
        this.errorMessage = 'Failed to load companies.';
        this.loading = false;
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
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formModel.companyLogo = input.files?.[0] ?? null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formModel.companyImage = input.files?.[0] ?? null;
  }

  saveCompany(): void {
    if (!this.formModel.companyName || !this.formModel.companyName.trim()) {
      this.formError = 'Company name is required.';
      return;
    }

    this.saving = true;
    this.formError = '';

    if (this.isEditMode && this.formModel.companyID) {
      this.employerService.update(this.formModel.companyID, this.formModel).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadCompanies();
        },
        error: (err) => {
          this.saving = false;
          this.formError = err?.error?.message || 'Failed to update company.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.employerService.add(this.formModel).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadCompanies();
        },
        error: (err) => {
          this.saving = false;
          this.formError = err?.error?.message || 'Failed to add company.';
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
    this.cdr.detectChanges();

    this.employerService.delete(company.companyID, true).subscribe({   // <-- changed false to true
      next: () => {
        this.deletingId = null;
        this.loadCompanies();
      },
      error: () => {
        this.deletingId = null;
        this.errorMessage = `Failed to delete "${company.companyName}".`;
        this.cdr.detectChanges();
      }
    });
  }
}
