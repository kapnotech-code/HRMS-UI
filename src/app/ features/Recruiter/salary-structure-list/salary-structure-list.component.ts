import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalaryStructureService } from '../../../core/services/salary-structure.service';
import {
  SalaryStructureResponse,
  SalaryStructureRequest
} from '../../../shared/models/salary-structure/salary-structure';
@Component({
  selector: 'app-salary-structure-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salary-structure-list.component.html',   
  styleUrl: './salary-structure-list.component.css'         
})
export class SalaryStructurePageComponent implements OnInit {


  structures: SalaryStructureResponse[] = [];
  loading = false;
  errorMessage = '';
  saving = false;

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  formStructureName = '';
  formPayFrequency = 'Monthly';
  formDescription = '';
  formIsActive = true;

  constructor(
    private service: SalaryStructureService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadStructures();
  }

  loadStructures(): void {
    this.loading = true;
    this.errorMessage = '';

    this.service.getAll().subscribe({
      next: (response) => {
        console.log('Salary Structure Response:', response);
        this.structures = response ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Salary Structure Error:', error);
        this.errorMessage = error?.error?.message || 'Unable to load salary structures.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(item: SalaryStructureResponse): void {
    this.isEditMode = true;
    this.currentId = item.ss_Id;
    this.formStructureName = item.ss_StructureName || '';
    this.formPayFrequency = item.ss_PayFrequency || 'Monthly';
    this.formDescription = item.ss_Description || '';
    this.formIsActive = item.ss_IsActive;
    this.showForm = true;
  }

  closeForm(): void {
    this.resetForm();
    this.showForm = false;
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.formStructureName = '';
    this.formPayFrequency = 'Monthly';
    this.formDescription = '';
    this.formIsActive = true;
  }

  saveStructure(): void {
    if (!this.formStructureName.trim()) {
      alert('Structure Name is required.');
      return;
    }
    if (!this.formPayFrequency.trim()) {
      alert('Pay Frequency is required.');
      return;
    }

    const payload: SalaryStructureRequest = {
      ss_StructureName: this.formStructureName.trim(),
      ss_PayFrequency: this.formPayFrequency.trim(),
      ss_Description: this.formDescription.trim(),
      ss_IsActive: this.formIsActive
    };

    this.saving = true;

    if (this.isEditMode && this.currentId !== null) {
      this.service.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Salary structure updated successfully.');
          this.closeForm();
          this.loadStructures();
        },
        error: (error) => {
          this.saving = false;
          alert(error?.error?.message || 'Update failed. Please try again.');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.service.add(payload).subscribe({
      next: () => {
        this.saving = false;
        alert('Salary structure added successfully.');
        this.closeForm();
        this.loadStructures();
      },
      error: (error) => {
        this.saving = false;
        alert(error?.error?.message || 'Save failed. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteStructure(item: SalaryStructureResponse): void {
    const confirmed = confirm(`Do you want to permanently delete "${item.ss_StructureName}"? This cannot be undone.`);
    if (!confirmed) return;

    this.service.delete(item.ss_Id).subscribe({
      next: () => {
        alert('Salary structure deleted successfully.');
        this.loadStructures();
      },
      error: (error) => {
        alert(error?.error?.message || 'Unable to delete salary structure.');
      }
    });
  }
}
