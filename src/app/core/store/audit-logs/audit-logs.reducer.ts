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
import * as AuditLogActions from './audit-logs.actions';
import {auditLogsAdapter, initialAuditLogsState} from './audit-logs.state';
import {ResourceType} from '../../model/resource-type';
import {appendToArray, removeFromArray} from '../../../shared/utils/array.utils';

export const auditLogsReducer = createReducer(
  initialAuditLogsState,
  on(AuditLogActions.getByProjectSuccess, (state, action) => auditLogsAdapter.setAll(action.auditLogs, state)),
  on(AuditLogActions.getByDocumentSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(
        log => log.resourceType === ResourceType.Document && log.resourceId === action.documentId,
        state
      )
    )
  ),
  on(AuditLogActions.getByLinkSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(
        log => log.resourceType === ResourceType.Link && log.resourceId === action.linkInstanceId,
        state
      )
    )
  ),
  on(AuditLogActions.getByCollectionSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(
        log =>
          (log.resourceType === ResourceType.Document && log.parentId === action.collectionId) ||
          log.resourceType === ResourceType.Collection,
        state
      )
    )
  ),
  on(AuditLogActions.getByLinkTypeSuccess, (state, action) =>
    auditLogsAdapter.upsertMany(
      action.auditLogs,
      auditLogsAdapter.removeMany(
        log =>
          (log.resourceType === ResourceType.Link && log.parentId === action.linkTypeId) ||
          log.resourceType === ResourceType.LinkType,
        state
      )
    )
  ),
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
    auditLogsAdapter.removeMany(
      log => log.resourceType === ResourceType.Collection && log.parentId === action.collectionId,
      state
    )
  ),
  on(AuditLogActions.clearByLinkType, (state, action) =>
    auditLogsAdapter.removeMany(
      log => log.resourceType === ResourceType.Link && log.parentId === action.linkTypeId,
      state
    )
  ),
  on(AuditLogActions.clear, () => initialAuditLogsState)
);
