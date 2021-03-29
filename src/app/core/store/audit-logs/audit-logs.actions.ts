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

export const getByDocument = createAction(
  '[AuditLogs] Get By Document',
  props<{documentId: string; collectionId: string}>()
);

export const getByDocumentSuccess = createAction(
  '[AuditLogs] Get By Document :: Success',
  props<{auditLogs: AuditLog[]; documentId: string}>()
);

export const getByDocumentFailure = createAction('[AuditLogs] Get By Document :: Failure', props<{error: any}>());

export const revertDocument = createAction(
  '[AuditLogs] Revert Document',
  props<{documentId: string; collectionId: string; auditLogId: string}>()
);

export const revertDocumentSuccess = createAction(
  '[AuditLogs] Revert Document :: Success',
  props<{auditLogId: string}>()
);

export const revertDocumentFailure = createAction(
  '[AuditLogs] Revert Document :: Failure',
  props<{error: any; auditLogId: string}>()
);

export const getByLink = createAction('[AuditLogs] Get By Link', props<{linkInstanceId: string; linkTypeId: string}>());

export const getByLinkSuccess = createAction(
  '[AuditLogs] Get By Link :: Success',
  props<{auditLogs: AuditLog[]; linkInstanceId: string}>()
);

export const getByLinkFailure = createAction('[AuditLogs] Get By Link :: Failure', props<{error: any}>());

export const revertLink = createAction(
  '[AuditLogs] Revert Link',
  props<{linkInstanceId: string; linkTypeId: string; auditLogId: string}>()
);

export const revertLinkSuccess = createAction('[AuditLogs] Revert Link :: Success', props<{auditLogId: string}>());

export const revertLinkFailure = createAction(
  '[AuditLogs] Revert Link :: Failure',
  props<{error: any; auditLogId: string}>()
);

export const clearByCollection = createAction('[AuditLogs] Clear By Collection', props<{collectionId: string}>());

export const clearByLink = createAction('[AuditLogs] Clear By Link', props<{linkTypeId: string}>());
