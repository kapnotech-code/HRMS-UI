import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DesignationService } from '../../../../core/services/designation.service';
import { EmployerService } from '../../../../core/services/company.service'; 
import { DesignationResponse } from '../../../../shared/models/designation-response/designation-response';
import { CompanyRequest } from '../../../../shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../../../shared/models/companylist/CompanyResponse';


@Component({
  selector: 'app-designation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './DesignationList.html',
  styleUrls: ['./DesignationList.css']
})
export class DesignationList implements OnInit {
  designations: DesignationResponse[] = [];
  filteredDesignations: DesignationResponse[] = [];
  companies: CompanyResponse[] = [];
  loading = true;
  errorMessage = '';
  saving = false;
  showForm = false;
  isEditMode = false;
  currentId: number | null = null;

  // filter
  filterTitle = '';

  formTitle = '';
  formCompanyID: number | null = null;

  // jab tak designations load nahi hote, edit id ko yaha rok ke rakho
  private pendingEditId: number | null = null;

  constructor(
    private designationService: DesignationService,
    private employerService: EmployerService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadData();

    // URL ke query param ke hisaab se modal open/close sync karo
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.isEditMode = false;
        this.currentId = null;
        this.formTitle = '';
        this.formCompanyID = null;
        this.showForm = true;
        this.pendingEditId = null;
      } else if (params['action'] === 'edit' && params['id']) {
        this.showForm = true;
        this.pendingEditId = +params['id'];
        // agar designations already load ho chuke hain to turant fill ho jayega,
        // warna loadData() complete hone par populateEditForm() dobara try karega
        this.populateEditForm();
      } else {
        this.showForm = false;
        this.pendingEditId = null;
      }
      this.cdr.detectChanges();
    });
  }

  // pendingEditId ke basis par form ko fill karta hai (agar data mil jaye)
  private populateEditForm(): void {
    if (this.pendingEditId == null) return;

    const item = this.designations.find(d => d.designationID === this.pendingEditId);
    if (item) {
      this.isEditMode = true;
      this.currentId = item.designationID;
      this.formTitle = item.designationName;
      this.formCompanyID = item.companyID ?? null;
      this.cdr.detectChanges();
    }
  }

  loadData(): void {
    this.loading = true;
    this.designationService.getAll().subscribe({
      next: (res) => {
        this.designations = res || [];
        this.applyFilter();
        this.loading = false;
        this.populateEditForm(); // data aane ke baad edit form fill karne ki dobara koshish
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Designations not loaded. please check backend.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCompanies(): void {
    this.employerService.getAllForDropdown().subscribe({
      next: (res) => {
        this.companies = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Companies not loaded:', err)
    });
  }

  getCompanyName(companyID: number | null | undefined): string {
    if (!companyID) return '-';
    const company: any = this.companies.find((c: any) => c.companyID === companyID);
    return company ? (company.companyName ?? company.employerName ?? '-') : '-';
  }

  applyFilter(): void {
    this.filteredDesignations = this.designations.filter(d => {
      return !this.filterTitle || d.designationName?.toLowerCase().includes(this.filterTitle.toLowerCase());
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterTitle = '';
    this.filteredDesignations = this.designations;
    this.cdr.detectChanges();
  }

  openAddForm(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'add' },
      queryParamsHandling: 'merge'
    });
  }

  openEditForm(item: DesignationResponse): void {
    console.log('Edit Item:', item);

    // Row ka data already table mein maujood hai, isliye form ko turant
    // yahin se fill kar do — API se dobara dhundhne ka wait nahi karna padega
    this.isEditMode = true;
    this.currentId = item.designationID;
    this.formTitle = item.designationName;
    this.formCompanyID = item.companyID ?? null;
    this.pendingEditId = item.designationID;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: 'edit', id: item.designationID },
      queryParamsHandling: 'merge'
    });
  }

  deleteItem(item: DesignationResponse): void {
    if (!confirm(`Do you want to delete "${item.designationName}"?`)) return;

    this.designationService.delete(item.designationID).subscribe({
      next: () => {
        alert('Designation deleted successfully.');
        this.loadData();
      },
      error: (err) => {
        alert('Delete failed.');
        console.error(err);
      }
    });
  }

  closeForm(): void {
    this.pendingEditId = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null, id: null },
      queryParamsHandling: 'merge'
    });
  }
  saveDesignation(): void {
    if (!this.formTitle.trim()) {
      alert('Designation name is needed');
      return;
    }

    if (!this.formCompanyID) {
      alert('Select company');
      return;
    }

    const payload = {
      designationName: this.formTitle,
      companyID: this.formCompanyID
    };

    this.saving = true;

    if (this.isEditMode && this.currentId) {
      // Update
      this.designationService.update(this.currentId, payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Designation updated successfully.');
          
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          alert('Update failed.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    } else {
      // Add
      this.designationService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          alert('Designation added successfully.');
         
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          alert('Designation already exists.');
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

}
