import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SalaryStructureComponentService } from '../../../core/services/Salary structure component.service';
import {
  SalaryStructureComponentRequest,
  SalaryStructureComponentResponse
} from '../../../shared/models/Salarystructurecomponent/salarystructurecomponent';

import { SalaryStructureService } from '../../../core/services/salary-structure.service';
import { SalaryStructureResponse } from '../../../shared/models/salary-structure/salary-structure';

import { SalaryComponentService } from '../../../core/services/salary-component.service';
import { SalaryComponentResponse } from '../../../shared/models/salary-component/salary-component.model';

@Component({
  selector: 'app-salary-structure-component-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './Salary structure component list.component.html',
  styleUrl: './Salary structure component list.component.css'
})
export class SalaryStructureComponentListComponent implements OnInit {

  mappings: SalaryStructureComponentResponse[] = [];
  structures: SalaryStructureResponse[] = [];
  components: SalaryComponentResponse[] = [];

  loading = false;
  errorMessage = '';
  saving = false;

  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // Form fields
  formSSId: number | null = null;
  formSCId: number | null = null;
  formCalculationType: 'Fixed' | 'Percentage' = 'Fixed';
  formValue: number | null = null;
  formDisplayOrder: number | null = null;

  constructor(
    private service: SalaryStructureComponentService,
    private structureService: SalaryStructureService,
    private componentService: SalaryComponentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadLookups();
    this.loadMappings();
  }

  // Structure & Component dropdowns — loaded once, used both in the
  // form and to show readable names in the table instead of raw ids.
  loadLookups(): void {
    this.structureService.getAll().subscribe({
      next: (res) => {
        this.structures = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load structures for dropdown:', err)
    });

    this.componentService.getAll().subscribe({
      next: (res) => {
        this.components = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load components for dropdown:', err)
    });
  }

  loadMappings(): void {
    this.loading = true;
    this.errorMessage = '';

    this.service.getAll().subscribe({
      next: (response) => {
        this.mappings = response.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Salary Structure Component Error:', error);
        this.errorMessage = error?.error?.message || 'Unable to load salary structure components.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  structureName(ssId: number): string {
    return this.structures.find(s => s.ss_Id === ssId)?.ss_StructureName || `#${ssId}`;
  }

  componentName(scId: number): string {
    return this.components.find(c => c.sc_Id === scId)?.sc_ComponentName || `#${scId}`;
  }

  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
  }

  openEditForm(item: SalaryStructureComponentResponse): void {
    this.isEditMode = true;
    this.currentId = item.SSC_Id;
    this.formSSId = item.SSC_SS_Id;
    this.formSCId = item.SSC_SC_Id;
    this.formCalculationType = item.SSC_CalculationType;
    this.formValue = item.SSC_Value;
    this.formDisplayOrder = item.SSC_DisplayOrder;
    this.showForm = true;
  }

  closeForm(): void {
    this.resetForm();
    this.showForm = false;
  }

  resetForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.formSSId = null;
    this.formSCId = null;
    this.formCalculationType = 'Fixed';
    this.formValue = null;
    this.formDisplayOrder = null;
  }

  saveMapping(): void {
    if (!this.formSSId || !this.formSCId) {
      alert('Please select both a Salary Structure and a Component.');
      return;
    }
    if (this.formValue === null || this.formValue < 0) {
      alert('Please enter a valid value.');
      return;
    }
    if (this.formDisplayOrder === null || this.formDisplayOrder < 0) {
      alert('Please enter a valid Display Order.');
      return;
    }

    const payload: SalaryStructureComponentRequest = {
      SSC_SS_Id: this.formSSId,
      SSC_SC_Id: this.formSCId,
      SSC_CalculationType: this.formCalculationType,
      SSC_Value: this.formValue,
      SSC_DisplayOrder: this.formDisplayOrder
    };

    this.saving = true;

    if (this.isEditMode && this.currentId !== null) {
      this.service.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Mapping updated successfully.');
          this.closeForm();
          this.loadMappings();
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
        alert('Mapping added successfully.');
        this.closeForm();
        this.loadMappings();
      },
      error: (error) => {
        this.saving = false;
        alert(error?.error?.message || 'Save failed. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteMapping(item: SalaryStructureComponentResponse): void {
    const confirmed = confirm(
      `Remove "${this.componentName(item.SSC_SC_Id)}" from "${this.structureName(item.SSC_SS_Id)}"? This cannot be undone.`
    );
    if (!confirmed) return;

    this.service.delete(item.SSC_Id).subscribe({
      next: () => {
        alert('Mapping deleted successfully.');
        this.loadMappings();
      },
      error: (error) => {
        alert(error?.error?.message || 'Unable to delete mapping.');
      }
    });
  }
}
