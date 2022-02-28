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

import {createAction, props} from '@ngrx/store';
import {AuditLog} from './audit-log.model';
import {Workspace} from '../navigation/workspace';

export const getByProject = createAction('[AuditLogs] Get By Project', props<{workspace?: Workspace}>());

export const getByProjectSuccess = createAction(
  '[AuditLogs] Get By Project : Success',
  props<{auditLogs: AuditLog[]}>()
);

export const getFailure = createAction('[AuditLogs] Get : Success', props<{error: any}>());

export const getByCollection = createAction(
  '[AuditLogs] Get By Collection',
  props<{collectionId: string; workspace?: Workspace}>()
);

export const getByCollectionSuccess = createAction(
  '[AuditLogs] Get By Collection :: Success',
  props<{collectionId: string; auditLogs: AuditLog[]}>()
);

export const getByLinkType = createAction(
  '[AuditLogs] Get By LinkType',
  props<{linkTypeId: string; workspace?: Workspace}>()
);

export const getByLinkTypeSuccess = createAction(
  '[AuditLogs] Get By LinkType',
  props<{linkTypeId: string; auditLogs: AuditLog[]}>()
);

export const getByDocument = createAction(
  '[AuditLogs] Get By Document',
  props<{documentId: string; collectionId: string; workspace?: Workspace}>()
);

export const getByDocumentSuccess = createAction(
  '[AuditLogs] Get By Document :: Success',
  props<{auditLogs: AuditLog[]; documentId: string}>()
);

export const getByDocumentFailure = createAction('[AuditLogs] Get By Document :: Failure', props<{error: any}>());

export const revert = createAction('[AuditLogs] Revert ', props<{auditLogId: string; workspace?: Workspace}>());

export const revertSuccess = createAction('[AuditLogs] Revert :: Success', props<{auditLogId: string}>());

export const revertFailure = createAction('[AuditLogs] Revert :: Failure', props<{error: any; auditLogId: string}>());

export const getByLink = createAction(
  '[AuditLogs] Get By Link',
  props<{linkInstanceId: string; linkTypeId: string; workspace?: Workspace}>()
);

export const getByLinkSuccess = createAction(
  '[AuditLogs] Get By Link :: Success',
  props<{auditLogs: AuditLog[]; linkInstanceId: string}>()
);

export const getByLinkFailure = createAction('[AuditLogs] Get By Link :: Failure', props<{error: any}>());

export const clearByCollection = createAction('[AuditLogs] Clear By Collection', props<{collectionId: string}>());

export const clearByLinkType = createAction('[AuditLogs] Clear By LinkType', props<{linkTypeId: string}>());

export const clear = createAction('[AuditLogs] Clear');
