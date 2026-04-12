import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
let SavedQueriesService = class SavedQueriesService {
    constructor(api) {
        this.api = api;
    }
    createSavedQuery(payload) {
        return this.api.post('/saved-queries', payload).pipe(map(res => {
            if (!res?.data) {
                throw new Error('Missing saved query response payload');
            }
            return res.data;
        }));
    }
    getClientSavedQueries(clientId, includeInactive = true) {
        const flag = includeInactive ? 'true' : 'false';
        return this.api.get(`/saved-queries/client/${clientId}?include_inactive=${flag}`).pipe(map(res => (Array.isArray(res?.data) ? res.data : [])));
    }
    updateSavedQuery(savedQueryId, payload) {
        return this.api.patch(`/saved-queries/${savedQueryId}`, payload).pipe(map(res => {
            if (!res?.data) {
                throw new Error('Missing saved query response payload');
            }
            return res.data;
        }));
    }
};
SavedQueriesService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], SavedQueriesService);
export { SavedQueriesService };
//# sourceMappingURL=saved-queries.service.js.map