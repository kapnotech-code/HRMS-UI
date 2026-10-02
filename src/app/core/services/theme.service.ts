import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CompanyBranding {
  companyId?: number;
  displayName: string;
  logoUrl?: string | null;
  primaryColor: string;
  primaryDark: string;
  accentColor: string;
  sidebarColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily?: string | null;
  slug?: string | null;
}

export const DEFAULT_BRANDING: CompanyBranding = {
  displayName: 'HRMS',
  primaryColor: '#14b8a6',
  primaryDark: '#0f766e',
  accentColor: '#0d5c56',
  sidebarColor: '#ffffff',
  backgroundColor: '#f8fafc',
  surfaceColor: '#ffffff',
  textColor: '#0f172a',
  fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly subject = new BehaviorSubject<CompanyBranding>(DEFAULT_BRANDING);
  readonly branding$ = this.subject.asObservable();

  constructor(private http: HttpClient) {
    this.apply(DEFAULT_BRANDING);
  }

  current(): CompanyBranding {
    return this.subject.value;
  }

  apply(raw: Partial<CompanyBranding> | null | undefined): void {
    const branding = this.normalize(raw);
    this.subject.next(branding);
    const root = document.documentElement;
    root.style.setProperty('--color-primary', branding.primaryColor);
    root.style.setProperty('--color-primary-dark', branding.primaryDark);
    root.style.setProperty('--color-accent', branding.accentColor);
    root.style.setProperty('--color-sidebar', branding.sidebarColor);
    root.style.setProperty('--color-bg', branding.backgroundColor);
    root.style.setProperty('--color-surface', branding.surfaceColor);
    root.style.setProperty('--color-text', branding.textColor);
    root.style.setProperty('--font-sans', branding.fontFamily || DEFAULT_BRANDING.fontFamily!);
  }

  reset(): void {
    this.apply(DEFAULT_BRANDING);
  }

  loadMine(): Observable<CompanyBranding> {
    return this.http.get<any>(`${environment.apiUrl}/Branding/me`).pipe(
      map(res => this.normalize(res?.data ?? res?.Data)),
      tap(b => this.apply(b)),
      catchError(() => {
        this.reset();
        return of(DEFAULT_BRANDING);
      })
    );
  }

  loadPublic(slug: string): Observable<CompanyBranding | null> {
    return this.http.get<any>(`${environment.apiUrl}/Branding/public/${encodeURIComponent(slug)}`).pipe(
      map(res => this.normalize(res?.data ?? res?.Data)),
      tap(b => this.apply(b)),
      catchError(() => of(null))
    );
  }

  save(body: CompanyBranding): Observable<CompanyBranding> {
    return this.http.put<any>(`${environment.apiUrl}/Branding/me`, body).pipe(
      map(res => this.normalize(res?.data ?? res?.Data)),
      tap(b => this.apply(b))
    );
  }

  uploadLogo(file: File): Observable<CompanyBranding> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<any>(`${environment.apiUrl}/Branding/logo`, form).pipe(
      map(res => this.normalize(res?.data ?? res?.Data)),
      tap(b => this.apply(b))
    );
  }

  assetUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const origin = environment.apiUrl.replace(/\/api\/?$/, '');
    return origin + (path.startsWith('/') ? path : `/${path}`);
  }

  private normalize(raw: any): CompanyBranding {
    const src = raw ?? {};
    return {
      companyId: src.companyId ?? src.CompanyId,
      displayName: src.displayName ?? src.DisplayName ?? DEFAULT_BRANDING.displayName,
      logoUrl: src.logoUrl ?? src.LogoUrl ?? null,
      primaryColor: src.primaryColor ?? src.PrimaryColor ?? DEFAULT_BRANDING.primaryColor,
      primaryDark: src.primaryDark ?? src.PrimaryDark ?? DEFAULT_BRANDING.primaryDark,
      accentColor: src.accentColor ?? src.AccentColor ?? DEFAULT_BRANDING.accentColor,
      sidebarColor: src.sidebarColor ?? src.SidebarColor ?? DEFAULT_BRANDING.sidebarColor,
      backgroundColor: src.backgroundColor ?? src.BackgroundColor ?? DEFAULT_BRANDING.backgroundColor,
      surfaceColor: src.surfaceColor ?? src.SurfaceColor ?? DEFAULT_BRANDING.surfaceColor,
      textColor: src.textColor ?? src.TextColor ?? DEFAULT_BRANDING.textColor,
      fontFamily: src.fontFamily ?? src.FontFamily ?? DEFAULT_BRANDING.fontFamily,
      slug: src.slug ?? src.Slug
    };
  }
}
