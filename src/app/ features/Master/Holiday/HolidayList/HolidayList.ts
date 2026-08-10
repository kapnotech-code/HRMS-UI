import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HolidayService } from '../../../../core/services/holiday.service';
import { HolidayResponse } from '../../../../shared/models/Holidays/HolidayResponse';
import { CompanyRequest } from '../../../../shared/models/companylist/CompanyRequest';
import { CompanyResponse } from '../../../../shared/models/companylist/CompanyResponse';
import { ApiResponse } from '../../../../shared/models/companylist/ ApiResponse';
import { EmployerService } from '../../../../core/services/company.service';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './HolidayList.html',
  styleUrls: ['./HolidayList.css']
})
export class HolidayList implements OnInit {
  holidays: HolidayResponse[] = [];
  filteredHolidays: HolidayResponse[] = [];
  companies: CompanyResponse[] = [];
  loading = false;
  errorMessage = '';

  // filters
  filterName = '';

  // modal state
  showForm = false;
  isEditMode = false;
  currentId: number | null = null;
  saving = false;

  formData = {
    holidayName: '',
    holidayDate: '',
    isOptional: false,
    companyID: null as number | null
  };

  constructor(
    private holidayService: HolidayService,
    private employerService: EmployerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadHoliday();
  }

  loadHoliday(): void {
    this.loading = true;
    this.holidayService.getAll().subscribe({
      next: (res) => {
        this.holidays = res.data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Holidays load nahi ho payi.';
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
      error: (err) => console.error('Companies load nahi hui:', err)
    });
  }

  getCompanyName(companyID: number | null): string {
    const company: any = this.companies.find((c: any) => c.companyID === companyID);
    return company ? (company.companyName ?? company.employerName ?? '-') : '-';
  }

  applyFilter(): void {
    this.filteredHolidays = this.holidays.filter(item => {
      return !this.filterName || item.holidayName?.toLowerCase().includes(this.filterName.toLowerCase());
    });
    this.cdr.detectChanges();
  }

  resetFilter(): void {
    this.filterName = '';
    this.filteredHolidays = this.holidays;
    this.cdr.detectChanges();
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentId = null;
    this.errorMessage = '';
    this.formData = {
      holidayName: '',
      holidayDate: '',
      isOptional: false,
      companyID: null
    };
    this.showForm = true;
    this.cdr.detectChanges();
  }

  editHoliday(item: HolidayResponse): void {
    this.isEditMode = true;
    this.currentId = item.holidayID;
    this.errorMessage = '';
    this.formData = {
      holidayName: item.holidayName,
      holidayDate: item.holidayDate ? item.holidayDate.split('T')[0] : '',
      isOptional: item.isOptional,
      companyID: item.companyID
    };
    this.showForm = true;
    this.cdr.detectChanges();
  }

  saveHoliday(): void {
    if (!this.formData.holidayName.trim()) {
      alert('Holiday naam likhna zaroori hai');
      return;
    }
    if (!this.formData.holidayDate) {
      alert('Holiday date select karna zaroori hai');
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.currentId) {
      const payload = { holidayID: this.currentId, ...this.formData };

      this.holidayService.update(payload as any).subscribe({
        next: () => {
          this.saving = false;
          alert('Holiday updated successfully.');
          this.showForm = false;
          this.loadHoliday();
        },
        error: (err) => {
          this.saving = false;
          alert('Update failed.');
          console.error(err);
          this.errorMessage = 'Update fail ho gaya.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.holidayService.add(this.formData as any).subscribe({
        next: () => {
          this.saving = false;
          alert('Holiday added successfully.');
          this.showForm = false;
          this.loadHoliday();
        },
        error: (err) => {
          this.saving = false;
          alert('al.');
          console.error(err);
          this.errorMessage = 'Add fail .';
          this.cdr.detectChanges();
        }
      });
    }
    }
 
  cancelForm(): void {
    this.showForm = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }
  deleteHoliday(id: number): void {
    if (!confirm('Do you want to delete this holiday?')) return;

    this.holidayService.delete(id).subscribe({
      next: () => {
        alert('Holiday deleted successfully.');
        this.loadHoliday();
      },
      error: (err) => {
        console.error(err);
        alert('Delete failed.');
        this.errorMessage = 'Unable to delete holiday';
        this.cdr.detectChanges();
      }
    });
  }
}
