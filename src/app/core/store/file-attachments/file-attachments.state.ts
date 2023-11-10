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
import {createSelector} from '@ngrx/store';
import {DataCursor} from '../../../shared/data-input/data-cursor';
import {AppState} from '../app.state';
import {selectWorkspaceWithIds} from '../common/common.selectors';
import {FileAttachment} from './file-attachment.model';

export interface FileAttachmentsState extends EntityState<FileAttachment> {
  loadedCollections?: string[];
  loadingCollections?: string[];
  loadedLinkTypes?: string[];
  loadingLinkTypes?: string[];
}

export const fileAttachmentsAdapter: EntityAdapter<FileAttachment> = createEntityAdapter<FileAttachment>();

export const initialFileAttachmentsState: FileAttachmentsState = fileAttachmentsAdapter.getInitialState();

export const selectFileAttachmentsState = (state: AppState) => state.fileAttachments;

const selectFileAttachments = createSelector(
  selectFileAttachmentsState,
  fileAttachmentsAdapter.getSelectors().selectAll
);
export const selectFileAttachmentsDictionary = createSelector(
  selectFileAttachmentsState,
  fileAttachmentsAdapter.getSelectors().selectEntities
);

export const selectLoadedFileAttachmentsCollections = createSelector(selectFileAttachmentsState, state => ({
  loaded: state.loadedCollections || [],
  loading: state.loadingCollections || [],
}));

export const selectLoadedFileAttachmentsLinkTypes = createSelector(selectFileAttachmentsState, state => ({
  loaded: state.loadedLinkTypes || [],
  loading: state.loadingLinkTypes || [],
}));

export const selectFileAttachmentsByIds = (fileIds: string[]) =>
  createSelector(selectFileAttachments, fileAttachments =>
    fileIds.length > 0 ? fileAttachments.filter(file => fileIds.includes(file.id)) : []
  );

export const selectFileAttachmentById = (fileId: string) =>
  createSelector(selectFileAttachments, fileAttachments => fileAttachments.find(file => file.id === fileId));

export const selectFileAttachmentsByWorkspace = createSelector(
  selectFileAttachments,
  selectWorkspaceWithIds,
  (fileAttachments, workspace) =>
    fileAttachments.filter(
      file => file.organizationId === workspace.organizationId && file.projectId === workspace.projectId
    )
);

export const selectFileAttachmentsByDataCursor = (cursor: DataCursor) =>
  createSelector(selectFileAttachmentsByWorkspace, fileAttachments =>
    fileAttachments.filter(
      file =>
        (cursor.collectionId || cursor.linkTypeId) &&
        (!cursor.collectionId || file.collectionId === cursor.collectionId) &&
        (!cursor.documentId || file.documentId === cursor.documentId) &&
        (!cursor.linkTypeId || file.linkTypeId === cursor.linkTypeId) &&
        (!cursor.linkInstanceId || file.linkInstanceId === cursor.linkInstanceId) &&
        (!cursor.attributeId || file.attributeId === cursor.attributeId)
    )
  );
