import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, CompanyBranding, DEFAULT_BRANDING } from '../../core/services/theme.service';
import { UiAlertComponent, UiButtonComponent, UiPageHeaderComponent } from '../../shared/ui';

@Component({
  selector: 'app-branding-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, UiPageHeaderComponent, UiAlertComponent, UiButtonComponent],
  templateUrl: './branding-settings.component.html',
  styleUrls: ['./branding-settings.component.css']
})
export class BrandingSettingsComponent implements OnInit {
  form: CompanyBranding = { ...DEFAULT_BRANDING };
  loading = false;
  saving = false;
  message = '';
  error = '';

  constructor(private theme: ThemeService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    this.theme.loadMine().subscribe({
      next: b => {
        this.form = { ...b };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load branding.';
        this.cdr.detectChanges();
      }
    });
  }

  preview(): void {
    this.theme.apply(this.form);
  }

  save(): void {
    this.error = '';
    this.message = '';
    this.saving = true;
    this.theme.save(this.form).subscribe({
      next: b => {
        this.form = { ...b };
        this.saving = false;
        this.message = 'Branding saved. New colors apply across the workspace.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.message || 'Save failed.';
        this.cdr.detectChanges();
      }
    });
  }

  onLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.theme.uploadLogo(file).subscribe({
      next: b => {
        this.form = { ...b };
        this.message = 'Logo uploaded.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = err?.error?.message || 'Logo upload failed.';
        this.cdr.detectChanges();
      }
    });
  }

  logoSrc(): string {
    return this.theme.assetUrl(this.form.logoUrl);
  }
}
