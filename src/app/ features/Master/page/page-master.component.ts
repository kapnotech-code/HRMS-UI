import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../../core/services/page.service';
import { MenuService } from '../../../core/services/menu.service';
import { Page } from '../../../shared/models/Pag/Page';
import { Menu } from '../../../shared/models/Menu/menu.model';

@Component({
  selector: 'app-page-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-master.component.html',
  styleUrl: './page-master.component.css'
})
export class PageMasterComponent implements OnInit {
  pages: Page[] = [];
  filteredPages: Page[] = [];
  page: Page = this.emptyPage();
  editMode = false;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = ''; // ⭐ ADDED — holds backend success message (Add/Update/Delete)
  menus: Menu[] = [];

  constructor(
    private service: PageService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadMenus();
    this.load();
  }

  loadMenus() {
    this.menuService.getAll().subscribe({
      next: (res: any) => {
        this.menus = res.data || res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Menus not loaded', err)
    });
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll().subscribe({
      next: (res: any) => {
        this.pages = res.data || res || [];
        this.filteredPages = this.pages;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Pages not loaded. Please check backend.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ⭐ FIXED — success message now comes from backend response (res.message)
  save() {
    if (!this.page.pageName?.trim() || !this.page.pageUrl?.trim()) {
      this.errorMessage = 'Please enter page name and URL.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const wasEdit = this.editMode;
    const request = this.editMode
      ? this.service.update(this.page.pageId!, this.page)
      : this.service.create(this.page);

    request.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.successMessage = res?.message ?? (wasEdit ? 'Page updated successfully.' : 'Page created successfully.');
        this.reset();
        this.load();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Save failed.';
        this.cdr.detectChanges();
      }
    });
  }

  edit(item: Page) {
    this.page = { ...item };
    this.editMode = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ⭐ FIXED — success message now comes from backend response (res.message)
  remove(id: number) {
    if (confirm('Delete this page?')) {
      this.errorMessage = '';
      this.successMessage = '';
      this.service.delete(id).subscribe({
        next: (res: any) => {
          this.successMessage = res?.message ?? 'Page deleted successfully.';
          this.load();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Delete failed.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  reset() {
    this.page = this.emptyPage();
    this.editMode = false;
    this.errorMessage = '';
    // successMessage jaan-boojh kar clear nahi kiya — save() ke baad user ko dikhna chahiye
  }

  private emptyPage(): Page {
    return {
      pageName: '',
      pageUrl: '',
      displayOrder: 0,
      isActive: true,
      menuId: null,
      menuName: null
    };
  }
}
