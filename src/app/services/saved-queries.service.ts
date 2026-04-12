import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { ApiService } from '../shared/services/api.service';

export interface SavedQueryRecord {
  _id: string;
  name: string;
  client_id: string;
  compiled_aql: string;
  query_preview: string;
  description?: string | null;
  dynamic_end_date?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  alerting_enabled: boolean;
}

export interface CreateSavedQueryPayload {
  name: string;
  client_id: string;
  compiled_aql: string;
  query_preview: string;
  description?: string | null;
  dynamic_end_date?: boolean;
  is_active?: boolean;
  alerting_enabled?: boolean;
}

export interface UpdateSavedQueryPayload {
  name?: string;
  compiled_aql?: string;
  query_preview?: string;
  description?: string | null;
  dynamic_end_date?: boolean;
  is_active?: boolean;
  alerting_enabled?: boolean;
}

interface ApiEnvelope<T> {
  status?: string;
  message?: string;
  data?: T;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SavedQueriesService {
  constructor(private readonly api: ApiService) {}

  createSavedQuery(payload: CreateSavedQueryPayload): Observable<SavedQueryRecord> {
    return this.api.post<ApiEnvelope<SavedQueryRecord>>('/saved-queries', payload).pipe(
      map(res => {
        if (!res?.data) {
          throw new Error('Missing saved query response payload');
        }
        return res.data;
      })
    );
  }

  getClientSavedQueries(clientId: string, includeInactive = true): Observable<SavedQueryRecord[]> {
    const flag = includeInactive ? 'true' : 'false';
    return this.api.get<ApiEnvelope<SavedQueryRecord[]>>(`/saved-queries/client/${clientId}?include_inactive=${flag}`).pipe(
      map(res => (Array.isArray(res?.data) ? res.data : []))
    );
  }

  updateSavedQuery(savedQueryId: string, payload: UpdateSavedQueryPayload): Observable<SavedQueryRecord> {
    return this.api.patch<ApiEnvelope<SavedQueryRecord>>(`/saved-queries/${savedQueryId}`, payload).pipe(
      map(res => {
        if (!res?.data) {
          throw new Error('Missing saved query response payload');
        }
        return res.data;
      })
    );
  }

  deleteSavedQuery(savedQueryId: string): Observable<void> {
    return this.api.delete<ApiEnvelope<unknown>>(`/saved-queries/${savedQueryId}`).pipe(
      map(() => void 0)
    );
  }

  supportsSavedQueryDelete(savedQueryId: string): Observable<boolean> {
    return this.api.options<unknown>(`/saved-queries/${savedQueryId}`, { observe: 'response' }).pipe(
      map((response: any) => {
        const allowHeader = response?.headers?.get?.('allow') ?? response?.headers?.get?.('Allow') ?? '';
        const allow = String(allowHeader).toUpperCase();
        if (allow) {
          return allow.includes('DELETE');
        }
        const status = Number(response?.status ?? 0);
        return status >= 200 && status < 400;
      }),
      catchError((error) => {
        const allowHeader = error?.headers?.get?.('allow') ?? error?.headers?.get?.('Allow') ?? '';
        const allow = String(allowHeader).toUpperCase();
        if (allow) {
          return of(allow.includes('DELETE'));
        }
        // If the server doesn't support OPTIONS cleanly (or strips Allow),
        // don't block the UI action. We'll rely on delete call result.
        return of(true);
      })
    );
  }
}
