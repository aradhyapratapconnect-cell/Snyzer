import { apiRequest } from './client.js';

/**
 * Account API (SNZ-034).
 *
 * Account identity itself comes from the Supabase session; this module covers
 * the destructive Snyzer-side operation. Deletion order is server-owned:
 * Supabase user first, then the data purge.
 */
export interface DeleteAccountResponse {
  deleted: boolean;
}

/** Permanently deletes the caller's account and all of its data. */
export function deleteAccount(): Promise<DeleteAccountResponse> {
  return apiRequest<DeleteAccountResponse>('/account', { method: 'DELETE' });
}
