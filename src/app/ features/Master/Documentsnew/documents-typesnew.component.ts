import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentTypesService } from '../../../core/services/documentsnew.service';
import { DocumentTypesResponse, DocumentTypesRequest } from '../../../shared/models/Documentsnew/documentsnew-typerequest.model';
import { DocumentCategoryService } from '../../../core/services/document-category.service';
import { DocumentCategory } from '../../../shared/models/documentcategory/document';

@Component({
  selector: 'app-document-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents-typesnew.component.html',
  styleUrls: ['./documents-typesnew.component.css']
})
export class DocumentComponent implements OnInit {
  items: DocumentTypesResponse[] = [];
  categories: DocumentCategory[] = [];   // ⭐ dropdown ke liye

  model: DocumentTypesRequest = this.emptyModel();

  isEdit = false;
  showModal = false;

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  // per-row delete loading state (CompanyList pattern)
  deletingId: number | null = null;

  constructor(
    private service: DocumentTypesService,
    private categoryService: DocumentCategoryService,   // ⭐ naya
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.loadCategories();   // ⭐ naya
  }

  private emptyModel(): DocumentTypesRequest {
    return {
      documentTypeId: 0,
      categoryId: 0,
      documentTypeName: '',
      isMandatory: false,
      expiryRequired: false,
      allowedExtensions: '',
      maxFileSizeMB: null,
      isActive: true
    };
  }

  // ===================================================
  // LOAD
  // ===================================================
  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.service.getAll(false).subscribe({
      next: (res) => {
        this.items = res?.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Document types load nahi hue:', err);
        this.errorMessage = err?.error?.message || 'Failed to load document types.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ⭐ naya - categories dropdown ke liye load karo
  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Categories load nahi hui:', err);
      }
    });
  }

  // ⭐ naya - table me categoryId ke bajaye naam dikhane ke liye
  getCategoryName(categoryId: number): string {
    const cat = this.categories.find(c => c.categoryId === categoryId);
    return cat ? cat.categoryName : '—';
  }

  // ⭐ Popup kholo — Add mode
  openAddModal(): void {
    this.model = this.emptyModel();
    this.isEdit = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.showModal = true;
  }

  // ⭐ Popup kholo — Edit mode, existing item ke data ke saath
  openEditModal(item: DocumentTypesResponse): void {
    this.model = {
      documentTypeId: item.documentTypeId,
      categoryId: item.categoryId,
      documentTypeName: item.documentTypeName,
      isMandatory: item.isMandatory,
      expiryRequired: item.expiryRequired,
      allowedExtensions: item.allowedExtensions ?? '',
      maxFileSizeMB: item.maxFileSizeMB ?? null,
      isActive: item.isActive
    };
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
    this.model = this.emptyModel();
    this.isEdit = false;
  }

  // ===================================================
  // SAVE (Add / Update)
  // ===================================================
  save(): void {
    if (!this.model.documentTypeName || !this.model.documentTypeName.trim()) {
      this.errorMessage = 'Document type name is required.';
      return;
    }
    if (!this.model.categoryId || this.model.categoryId <= 0) {
      this.errorMessage = 'A valid Category is required.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = `Document type "${this.model.documentTypeName}" updated successfully.`;
          this.model = this.emptyModel();
          this.isEdit = false;
          this.loadData();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Update failed:', err);
          this.errorMessage = err?.error?.message || 'Failed to update document type. Please try again.';
          this.saving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.service.add(this.model).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = `Document type "${this.model.documentTypeName}" added successfully.`;
          this.model = this.emptyModel();
          this.loadData();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Add failed:', err);
          this.errorMessage = err?.error?.message || 'Failed to add document type. Please try again.';
          this.saving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ===================================================
  // DELETE
  // ===================================================
  delete(id: number): void {
    if (!confirm('Are you sure you want to delete this document type?')) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingId = id;
    this.cdr.detectChanges();

    this.service.delete(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage = 'Document type deleted successfully.';
        this.loadData();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.deletingId = null;
        this.errorMessage = err?.error?.message || 'Failed to delete document type. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
