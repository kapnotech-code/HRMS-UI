import { environment } from '../../../environments/environment';

/** API origin that serves wwwroot files (not the Angular host). */
export function fileOrigin(): string {
  return environment.apiUrl.replace(/\/api\/?$/, '');
}

/** Turns a stored path like /uploads/profile-pictures/x.png into a browser URL. */
export function resolveFileUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }
  const trimmed = String(path).trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return fileOrigin() + (trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
}

export function uploadedFilePath(res: any): string {
  const data = res?.data ?? res?.Data ?? {};
  return (
    data.path ??
    data.filePath ??
    data.Path ??
    data.FilePath ??
    res?.filePath ??
    res?.path ??
    ''
  );
}
