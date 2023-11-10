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

import {FileAttachmentsAction, FileAttachmentsActionType} from './file-attachments.action';
import {fileAttachmentsAdapter, FileAttachmentsState, initialFileAttachmentsState} from './file-attachments.state';
import {FileApiPath} from '../../data-service/attachments/attachments.service';
import {FileAttachment} from './file-attachment.model';
import {fileAttachmentHasApiPath, isOnlyCollectionApiPath, isOnlyLinkTypeApiPath} from './file-attachment.utils';
import {appendToArray, removeFromArray} from '../../../shared/utils/array.utils';

export function fileAttachmentsReducer(
  state: FileAttachmentsState = initialFileAttachmentsState,
  action: FileAttachmentsAction.All
): FileAttachmentsState {
  switch (action.type) {
    case FileAttachmentsActionType.GET_SUCCESS:
      return getSuccessAttachments(state, action.payload.path, action.payload.fileAttachments);
    case FileAttachmentsActionType.SET_LOADING:
      return setLoadingResources(state, action.payload, action.payload.loading);
    case FileAttachmentsActionType.SET_UPLOADING:
      return fileAttachmentsAdapter.updateOne(
        {
          id: action.payload.fileId,
          changes: {uploading: action.payload.uploading},
        },
        state
      );
    case FileAttachmentsActionType.CREATE_SUCCESS:
      return fileAttachmentsAdapter.addMany(action.payload.fileAttachments, state);
    case FileAttachmentsActionType.REMOVE_SUCCESS:
      return fileAttachmentsAdapter.removeMany(action.payload.fileIds, state);
    case FileAttachmentsActionType.CLEAR:
      return initialFileAttachmentsState;
    default:
      return state;
  }
}

function getSuccessAttachments(
  state: FileAttachmentsState,
  path: FileApiPath,
  fileAttachments: FileAttachment[]
): FileAttachmentsState {
  const deletedState = fileAttachmentsAdapter.removeMany(
    attachment => fileAttachmentHasApiPath(attachment, path),
    state
  );

  return fileAttachmentsAdapter.upsertMany(fileAttachments, addLoadedResources(deletedState, path));
}

function addLoadedResources(state: FileAttachmentsState, path: FileApiPath): FileAttachmentsState {
  if (isOnlyCollectionApiPath(path)) {
    return {
      ...state,
      loadedCollections: appendToArray(state.loadedCollections, path.collectionId),
      loadingCollections: removeFromArray(state.loadedCollections, path.collectionId),
    };
  }
  if (isOnlyLinkTypeApiPath(path)) {
    return {
      ...state,
      loadedLinkTypes: appendToArray(state.loadingLinkTypes, path.linkTypeId),
      loadingLinkTypes: removeFromArray(state.loadingLinkTypes, path.linkTypeId),
    };
  }

  return state;
}

function setLoadingResources(state: FileAttachmentsState, path: FileApiPath, loading: boolean): FileAttachmentsState {
  if (isOnlyCollectionApiPath(path)) {
    return {
      ...state,
      loadingCollections: loading
        ? appendToArray(state.loadingCollections, path.collectionId)
        : removeFromArray(state.loadedCollections, path.collectionId),
    };
  }
  if (isOnlyLinkTypeApiPath(path)) {
    return {
      ...state,
      loadingLinkTypes: loading
        ? appendToArray(state.loadingLinkTypes, path.linkTypeId)
        : removeFromArray(state.loadingLinkTypes, path.linkTypeId),
    };
  }

  return state;
}
