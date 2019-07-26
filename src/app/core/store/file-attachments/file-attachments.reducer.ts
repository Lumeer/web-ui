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

export function fileAttachmentsReducer(
  state: FileAttachmentsState = initialFileAttachmentsState,
  action: FileAttachmentsAction.All
): FileAttachmentsState {
  switch (action.type) {
    case FileAttachmentsActionType.GET_SUCCESS:
      return fileAttachmentsAdapter.upsertMany(action.payload.fileAttachments, state);
    case FileAttachmentsActionType.CREATE_SUCCESS:
      return fileAttachmentsAdapter.addOne(action.payload.fileAttachment, state);
    case FileAttachmentsActionType.REMOVE_SUCCESS:
      return fileAttachmentsAdapter.removeOne(action.payload.fileId, state);
    case FileAttachmentsActionType.CLEAR:
      return initialFileAttachmentsState;
    default:
      return state;
  }
}
