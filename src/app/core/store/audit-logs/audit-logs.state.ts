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
import {
  isCollectionAuditLog,
  isDocumentAuditLog,
  isLinkAuditLog,
  isLinkTypeAuditLog,
  isProjectAuditLog,
} from './audit-log.utils';

export interface AuditLogsState extends EntityState<AuditLog> {
  loadingProjects: string[];
  loadingCollections: string[];
  loadingLinkTypes: string[];
  loadingDocuments: string[];
  loadingLinkInstances: string[];
  revertingIds: string[];
}

export const auditLogsAdapter: EntityAdapter<AuditLog> = createEntityAdapter<AuditLog>();

export const initialAuditLogsState: AuditLogsState = auditLogsAdapter.getInitialState({
  loadingProjects: [],
  loadingCollections: [],
  loadingLinkTypes: [],
  loadingDocuments: [],
  loadingLinkInstances: [],
  revertingIds: [],
});

export const selectAuditLogsState = (state: AppState) => state.auditLogs;

export const {selectIds, selectEntities, selectAll, selectTotal} = auditLogsAdapter.getSelectors();

export const selectAuditLogs = createSelector(selectAuditLogsState, selectAll);

export const selectRevertingAuditLogsIds = createSelector(selectAuditLogsState, state => state.revertingIds);

export const selectAuditLogsByProject = (projectId: string) =>
  createSelector(selectAuditLogs, logs => sortByDate(logs.filter(log => isProjectAuditLog(log, projectId))));

export const selectAuditLogsByProjectLoading = (projectId: string) =>
  createSelector(selectAuditLogsState, state => state.loadingProjects.includes(projectId));

export const selectAuditLogsByCollection = (collectionId: string) =>
  createSelector(selectAuditLogs, logs => sortByDate(logs.filter(log => isCollectionAuditLog(log, collectionId))));

export const selectAuditLogsByCollectionLoading = (collectionId: string) =>
  createSelector(selectAuditLogsState, state => state.loadingCollections.includes(collectionId));

export const selectAuditLogsByLinkType = (linkTypeId: string) =>
  createSelector(selectAuditLogs, logs => sortByDate(logs.filter(log => isLinkTypeAuditLog(log, linkTypeId))));

export const selectAuditLogsByLinkTypeLoading = (linkTypeId: string) =>
  createSelector(selectAuditLogsState, state => state.loadingLinkTypes.includes(linkTypeId));

export const selectAuditLogsByDocument = (documentId: string) =>
  createSelector(selectAuditLogs, logs => sortByDate(logs.filter(log => isDocumentAuditLog(log, documentId))));

export const selectAuditLogsByDocumentLoading = (documentId: string) =>
  createSelector(selectAuditLogsState, state => state.loadingDocuments.includes(documentId));

export const selectAuditLogsByLink = (linkInstanceId: string) =>
  createSelector(selectAuditLogs, logs => sortByDate(logs.filter(log => isLinkAuditLog(log, linkInstanceId))));

export const selectAuditLogsByLinkLoading = (linkInstanceId: string) =>
  createSelector(selectAuditLogsState, state => state.loadingLinkInstances.includes(linkInstanceId));

function sortByDate(logs: AuditLog[], sortDesc = true): AuditLog[] {
  return [...logs].sort((a, b) => {
    const value = a.changeDate?.getTime() - b.changeDate?.getTime();
    return (value !== 0 ? value : a.id.localeCompare(b.id)) * (sortDesc ? -1 : 1);
  });
}
