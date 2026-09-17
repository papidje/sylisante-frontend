import { HttpErrorResponse } from '@angular/common/http';

/** Message lisible depuis un ProblemDetail Spring (detail + erreurs de champs). */
export function apiErrorMessage(err: HttpErrorResponse, fallback: string): string {
  const body = err.error as
    | { detail?: string; message?: string; errors?: Record<string, string> }
    | string
    | null;
  if (!body) return fallback;
  if (typeof body === 'string' && body.trim()) return body;

  if (typeof body === 'object') {
    const fieldErrors = body.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const msgs = Object.values(fieldErrors).filter(v => typeof v === 'string' && v.trim());
      if (msgs.length) return [...new Set(msgs)].join(' · ');
    }
    if (body.detail && body.detail !== 'Des erreurs de validation ont été trouvées') {
      return body.detail;
    }
    if (body.message) return body.message;
    if (body.detail) return body.detail;
  }
  return fallback;
}
