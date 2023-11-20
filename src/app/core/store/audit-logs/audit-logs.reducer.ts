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
import {createReducer, on} from '@ngrx/store';

import {appendToArray, removeFromArray} from '../../../shared/utils/array.utils';
import {
  isCollectionAuditLog,
  isDocumentAuditLog,
  isLinkAuditLog,
  isLinkTypeAuditLog,
  isProjectAuditLogByUser,
} from './audit-log.utils';
import * as AuditLogActions from './audit-logs.actions';
import {auditLogsAdapter, initialAuditLogsState} from './audit-logs.state';

export const auditLogsReducer = createReducer(
  initialAuditLogsState,
  on(AuditLogActions.getByProject, (state, action) => ({
    ...state,
    loadingProjects: appendToArray(state.loadingProjects, action.projectId),
  })),
  on(AuditLogActions.getByProjectSuccess, (state, action) =>
    auditLogsAdapter.setAll(action.auditLogs, {
      ...state,
      loadingProjects: removeFromArray(state.loadingProjects, action.projectId),
    })
  ),
  on(AuditLogActions.getByProjectFailure, (state, action) => ({
    ...state,
    loadingProjects: removeFromArray(state.loadingProjects, action.projectId),
  })),

  on(AuditLogActions.getByUser, (state, action) => ({
    ...state,
    loadingUsers: appendToArray(state.loadingUsers, action.userId),
  })),
  on(AuditLogActions.getByUserSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(log => isProjectAuditLogByUser(log, action.projectId, action.userId), {
        ...state,
        loadingUsers: removeFromArray(state.loadingUsers, action.userId),
      })
    )
  ),
  on(AuditLogActions.getByUserFailure, (state, action) => ({
    ...state,
    loadingUsers: removeFromArray(state.loadingUsers, action.userId),
  })),

  on(AuditLogActions.getByCollection, (state, action) => ({
    ...state,
    loadingCollections: appendToArray(state.loadingCollections, action.collectionId),
  })),
  on(AuditLogActions.getByCollectionSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(log => isCollectionAuditLog(log, action.collectionId), {
        ...state,
        loadingCollections: removeFromArray(state.loadingCollections, action.collectionId),
      })
    )
  ),
  on(AuditLogActions.getByCollectionFailure, (state, action) => ({
    ...state,
    loadingCollections: removeFromArray(state.loadingCollections, action.collectionId),
  })),

  on(AuditLogActions.getByLinkType, (state, action) => ({
    ...state,
    loadingLinkTypes: appendToArray(state.loadingLinkTypes, action.linkTypeId),
  })),
  on(AuditLogActions.getByLinkTypeSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(log => isLinkTypeAuditLog(log, action.linkTypeId), {
        ...state,
        loadingLinkTypes: removeFromArray(state.loadingLinkTypes, action.linkTypeId),
      })
    )
  ),
  on(AuditLogActions.getByLinkTypeFailure, (state, action) => ({
    ...state,
    loadingLinkTypes: removeFromArray(state.loadingLinkTypes, action.linkTypeId),
  })),

  on(AuditLogActions.getByDocument, (state, action) => ({
    ...state,
    loadingDocuments: appendToArray(state.loadingDocuments, action.documentId),
  })),
  on(AuditLogActions.getByDocumentSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(log => isDocumentAuditLog(log, action.documentId), {
        ...state,
        loadingDocuments: removeFromArray(state.loadingDocuments, action.documentId),
      })
    )
  ),
  on(AuditLogActions.getByDocumentFailure, (state, action) => ({
    ...state,
    loadingDocuments: removeFromArray(state.loadingDocuments, action.documentId),
  })),

  on(AuditLogActions.getByLink, (state, action) => ({
    ...state,
    loadingLinkInstances: appendToArray(state.loadingLinkInstances, action.linkInstanceId),
  })),
  on(AuditLogActions.getByLinkSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(log => isLinkAuditLog(log, action.linkInstanceId), {
        ...state,
        loadingLinkInstances: removeFromArray(state.loadingLinkInstances, action.linkInstanceId),
      })
    )
  ),
  on(AuditLogActions.getByLinkFailure, (state, action) => ({
    ...state,
    loadingLinkInstances: removeFromArray(state.loadingLinkInstances, action.linkInstanceId),
  })),

  on(AuditLogActions.revert, (state, action) => ({
    ...state,
    revertingIds: appendToArray(state.revertingIds, action.auditLogId),
  })),
  on(AuditLogActions.revertSuccess, (state, action) => auditLogsAdapter.removeOne(action.auditLogId, state)),
  on(AuditLogActions.revertFailure, (state, action) => ({
    ...state,
    revertingIds: removeFromArray(state.revertingIds, action.auditLogId),
  })),
  on(AuditLogActions.clearByCollection, (state, action) =>
    auditLogsAdapter.removeMany(log => isCollectionAuditLog(log, action.collectionId), state)
  ),
  on(AuditLogActions.clearByLinkType, (state, action) =>
    auditLogsAdapter.removeMany(log => isLinkTypeAuditLog(log, action.linkTypeId), state)
  ),
  on(AuditLogActions.clear, () => initialAuditLogsState)
);
