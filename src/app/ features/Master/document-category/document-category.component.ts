import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentCategoryService } from '../../../core/services/document-category.service';
import { DocumentCategory } from '../../../shared/models/documentcategory/document';

@Component({
  selector: 'app-document-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-category.component.html',
  styleUrls: ['./document-category.component.css']
})
export class DocumentCategoryComponent implements OnInit {
  categories: DocumentCategory[] = [];

  model: DocumentCategory = this.emptyModel();

  isEdit = false;
  showModal = false;

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  // per-row delete loading state (CompanyList pattern)
  deletingId: number | null = null;

  constructor(
    private service: DocumentCategoryService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  private emptyModel(): DocumentCategory {
    return {
      categoryName: '',
      description: '',
      isActive: true
    };
  }

  // ===================================================
  // LOAD
  // ===================================================
  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.service.getAll().subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Categories load nahi hui:', err);
        this.errorMessage = 'Failed to load categories. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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
  openEditModal(item: DocumentCategory): void {
    this.model = { ...item };
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
    if (!this.model.categoryName || !this.model.categoryName.trim()) {
      this.errorMessage = 'Category name is required.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEdit) {
      this.service.update(this.model.categoryId!, this.model).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = `Category "${this.model.categoryName}" updated successfully.`;
          this.model = this.emptyModel();
          this.isEdit = false;
          this.loadData();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Update failed:', err);
          this.errorMessage = 'Failed to update category. Please try again.';
          this.saving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.service.add(this.model).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.successMessage = `Category "${this.model.categoryName}" added successfully.`;
          this.model = this.emptyModel();
          this.loadData();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Add failed:', err);
          this.errorMessage = 'Failed to add category. Please try again.';
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
    if (!confirm('This will permanently delete this category from the database. This cannot be undone. Continue?')) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingId = id;
    this.cdr.detectChanges();

    // ⭐ hardDelete = true → record database se permanently remove hoga
    this.service.delete(id, true).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage = 'Category permanently deleted.';
        this.loadData();
      },

      error: (err) => {
        console.error('Delete failed:', err);

        this.deletingId = null;

        const message = err.error?.message
          || 'Unable to delete category.';

        this.errorMessage = message;

        this.cdr.detectChanges();

        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }
}
