import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { MenuService } from '../../../core/services/menu.service';
import { PageService } from '../../../core/services/page.service';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './Menu-Form-component.html',
  styleUrls: ['./Menu-Form-Component.css']
})
export class MenuFormComponent implements OnInit, OnDestroy {

  menus: any[] = [];
  filteredMenus: any[] = [];
  searchText: string = '';

  showModal = false;

  loading = false;
  loadingLookups = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  editId: number | null = null;

  pages: any[] = [];
  availableParentMenus: any[] = [];
  form!: FormGroup;

  isParentGroup = true;

  parentMenuText: string = '';
  parentMenuNotFound = false;

  pageText: string = '';
  pageNotFound = false;

  private destroy$ = new Subject<void>();

  constructor(
    private menuService: MenuService,
    private pageService: PageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.loadMenus();
    this.loadPages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMenus() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // 👈 loading=true turant reflect karne ke liye

    this.menuService.getAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('Menu API response:', res); // 👈 debug ke liye rakho, baad me hata dena
          this.menus = res?.data ?? res ?? [];
          this.filteredMenus = this.menus;
          this.availableParentMenus = [...this.menus];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Menus not loaded', err);
          this.menus = [];
          this.filteredMenus = [];
          this.errorMessage = err?.error?.message || 'Menus not loaded. Please check backend.';
          this.cdr.detectChanges();
        }
      });
  }

  loadPages() {
    this.loadingLookups = true;

    this.pageService.getAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingLookups = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.pages = res?.data ?? res ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading pages', err);
          this.pages = [];
          this.errorMessage = err?.error?.message || 'Pages not loaded. Please check backend.';
          this.cdr.detectChanges();
        }
      });
  }

  applyFilter() {
    const term = this.searchText.trim().toLowerCase();
    this.filteredMenus = !term
      ? this.menus
      : this.menus.filter(m => m.menuName?.toLowerCase().includes(term));
  }

  resetFilter() {
    this.searchText = '';
    this.filteredMenus = this.menus;
  }

  onDelete(item: any) {
    if (!confirm(`Delete menu "${item.menuName}"?`)) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.menuService.delete(item.menuId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.successMessage = res?.message ?? 'Menu deleted successfully.';
          this.loadMenus();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err?.error?.message ?? 'Error while deleting menu.';
          this.cdr.detectChanges();
        }
      });
  }

  buildForm() {
    this.form = this.fb.group({
      menuName: ['', Validators.required],
      parentMenuId: [null],
      pageId: [null, Validators.required],
      icon: [''],
      displayOrder: [1],
      isActive: [true]
    });
  }

  onParentMenuTextChange(value: string) {
    this.parentMenuText = value;
    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
      this.setParentMenuId(null);
      this.parentMenuNotFound = false;
      return;
    }

    const matched = this.availableParentMenus.find(
      m => m.menuName?.toLowerCase() === trimmed
    );

    if (matched) {
      this.setParentMenuId(matched.menuId);
      this.parentMenuNotFound = false;
    } else {
      this.setParentMenuId(null);
      this.parentMenuNotFound = true;
    }
  }

  private setParentMenuId(parentMenuId: number | null) {
    this.form.get('parentMenuId')?.setValue(parentMenuId);
    const pageControl = this.form.get('pageId');

    if (parentMenuId === null) {
      this.isParentGroup = true;
      pageControl?.clearValidators();
      pageControl?.setValue(null);
      this.pageText = '';
      this.pageNotFound = false;
    } else {
      this.isParentGroup = false;
      pageControl?.setValidators([Validators.required]);
    }
    pageControl?.updateValueAndValidity();
  }

  onPageTextChange(value: string) {
    this.pageText = value;
    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
      this.form.get('pageId')?.setValue(null);
      this.pageNotFound = false;
      return;
    }

    const matched = this.pages.find(
      p => p.pageName?.toLowerCase() === trimmed
    );

    if (matched) {
      this.form.get('pageId')?.setValue(matched.pageId);
      this.pageNotFound = false;
    } else {
      this.form.get('pageId')?.setValue(null);
      this.pageNotFound = true;
    }
  }

  openAddModal() {
    this.editId = null;
    this.availableParentMenus = [...this.menus];
    this.isParentGroup = true;
    this.parentMenuText = '';
    this.parentMenuNotFound = false;
    this.pageText = '';
    this.pageNotFound = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.form.reset({
      menuName: '',
      parentMenuId: null,
      pageId: null,
      icon: '',
      displayOrder: 1,
      isActive: true
    });
    this.showModal = true;
  }

  openEditModal(item: any) {
    this.editId = item.menuId;
    this.availableParentMenus = this.menus.filter(
      x => x.menuId !== item.menuId
    );

    this.form.patchValue({
      menuName: item.menuName,
      parentMenuId: item.parentMenuId ?? null,
      pageId: item.pageId ?? null,
      icon: item.icon ?? '',
      displayOrder: item.displayOrder ?? 1,
      isActive: item.isActive ?? true
    });

    const parent = this.availableParentMenus.find(m => m.menuId === item.parentMenuId);
    this.parentMenuText = parent ? parent.menuName : '';
    this.parentMenuNotFound = false;
    this.isParentGroup = item.parentMenuId == null;

    const page = this.pages.find(p => p.pageId === item.pageId);
    this.pageText = page ? page.pageName : '';
    this.pageNotFound = false;

    const pageControl = this.form.get('pageId');
    if (this.isParentGroup) {
      pageControl?.clearValidators();
    } else {
      pageControl?.setValidators([Validators.required]);
    }
    pageControl?.updateValueAndValidity();

    this.errorMessage = '';
    this.successMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please fill required fields';
      return;
    }

    if (this.parentMenuText.trim() && this.parentMenuNotFound) {
      this.errorMessage = 'This Parent Menu doesnt exist yet. Please create it first as a separate';
      return;
    }

    if (!this.isParentGroup && this.pageNotFound) {
      this.errorMessage = 'This page doesnt exist.Please create it first in the Page Master..';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const isEdit = !!this.editId;
    const request$ = isEdit
      ? this.menuService.update(this.editId!, this.form.value)
      : this.menuService.create(this.form.value);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.successMessage = res?.message ?? (isEdit ? 'Menu updated successfully.' : 'Menu created successfully.');
          this.showModal = false;
          this.loadMenus();
        },
        error: (err: any) => {
          console.error(err);
          this.errorMessage = err?.error?.message ?? 'Error while saving menu.';
          this.cdr.detectChanges();
        }
      });
  }
}
