/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {AuditLog} from './audit-log.model';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {ResourceType} from '../../model/resource-type';

export interface AuditLogsState extends EntityState<AuditLog> {
  revertingIds: string[];
}

export const auditLogsAdapter: EntityAdapter<AuditLog> = createEntityAdapter<AuditLog>();

export const initialAuditLogsState: AuditLogsState = auditLogsAdapter.getInitialState({
  revertingIds: [],
});

export const selectAuditLogsState = (state: AppState) => state.auditLogs;

export const {selectIds, selectEntities, selectAll, selectTotal} = auditLogsAdapter.getSelectors();

export const selectAuditLogs = createSelector(selectAuditLogsState, selectAll);

export const selectRevertingAuditLogsIds = createSelector(selectAuditLogsState, state => state.revertingIds);

export const selectAuditLogsByDocument = (documentId: string) =>
  createSelector(selectAuditLogs, logs =>
    sortByDate(logs.filter(log => log.resourceType === ResourceType.Document && log.resourceId === documentId))
  );

export const selectAuditLogsByLink = (linkInstanceId: string) =>
  createSelector(selectAuditLogs, logs =>
    sortByDate(logs.filter(log => log.resourceType === ResourceType.Link && log.resourceId === linkInstanceId))
  );

function sortByDate(logs: AuditLog[], sortDesc = true): AuditLog[] {
  return [...logs].sort((a, b) => {
    const value = a.changeDate?.getTime() - b.changeDate?.getTime();
    return (value !== 0 ? value : a.id.localeCompare(b.id)) * (sortDesc ? -1 : 1);
  });
}
