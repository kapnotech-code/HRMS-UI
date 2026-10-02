import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankService } from '../../../../app/core/services/Bank.service';
import { BankRequest } from '../../../../app/shared/models/Bank/Bankrequest';
import { BankResponse } from '../../../../app/shared/models/Bank/Bankresponse';

@Component({
  selector: 'app-bank-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './BankList.html',
  styleUrl: './Banklist.css'
})
export class BankList implements OnInit {
  banks: BankResponse[] = [];
  filteredBanks: BankResponse[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';
  searchText = '';

  // ---------- Modal state ----------
  showModal = false;
  isEditMode = false;
  saving = false;
  formError = '';

  formModel: BankRequest = this.emptyForm();

  constructor(
    private bankService: BankService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadBanks();
  }

  private emptyForm(): BankRequest {
    return {
      bankID: undefined,
      bankName: '',
      branchName: '',
      ifscCode: '',
      city: '',
      state: '',
      country: ''
    };
  }

  // ---------- Helpers to show & auto-clear messages ----------
  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  // ===================================================
  // LOAD
  // ===================================================
  loadBanks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.bankService.getAll().subscribe({
      next: (res) => {
        this.banks = res.data ?? [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.showError('Failed to load banks.');
      }
    });
  }

  applyFilter(): void {
    const term = this.searchText.trim().toLowerCase();
    this.filteredBanks = !term
      ? [...this.banks]
      : this.banks.filter(b =>
        (b.bankName ?? '').toLowerCase().includes(term) ||
        (b.branchName ?? '').toLowerCase().includes(term) ||
        (b.ifscCode ?? '').toLowerCase().includes(term) ||
        (b.city ?? '').toLowerCase().includes(term)
      );
  }

  // ===================================================
  // MODAL — ADD / EDIT
  // ===================================================
  openAddModal(): void {
    this.isEditMode = false;
    this.formModel = this.emptyForm();
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(bank: BankResponse): void {
    this.isEditMode = true;
    this.formModel = {
      bankID: bank.bankID,
      bankName: bank.bankName,
      branchName: bank.branchName,
      ifscCode: bank.ifscCode,
      city: bank.city,
      state: bank.state,
      country: bank.country
    };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
  }

  saveBank(): void {
    if (!this.formModel.bankName || !this.formModel.bankName.trim()) {
      this.formError = 'Bank name is required.';
      return;
    }

    this.saving = true;
    this.formError = '';

    if (this.isEditMode && this.formModel.bankID) {
      this.bankService.update(this.formModel.bankID, this.formModel).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadBanks();
          this.showSuccess(`Bank "${this.formModel.bankName}" updated successfully.`);
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Failed to update bank.';
          this.formError = msg;
          this.showError(msg);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.bankService.add(this.formModel).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadBanks();
          this.showSuccess(`Bank "${this.formModel.bankName}" added successfully.`);
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Failed to add bank.';
          this.formError = msg;
          this.showError(msg);
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ===================================================
  // DELETE (hard delete — permanently removes the row from the database)
  // ===================================================
  deletingId: number | null = null;

  deleteBank(bank: BankResponse): void {
    const confirmed = window.confirm(`Permanently delete bank "${bank.bankName}"? This action cannot be undone.`);
    if (!confirmed) return;

    this.deletingId = bank.bankID;
    this.cdr.detectChanges();

    this.bankService.delete(bank.bankID, true).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadBanks();
        this.showSuccess(`Bank "${bank.bankName}" deleted successfully.`);
      },
      error: () => {
        this.deletingId = null;
        this.showError(`Failed to delete "${bank.bankName}".`);
      }
    });
  }
}
