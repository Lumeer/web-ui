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

import {initialResourceCommentsState, resourceCommentsAdapter, ResourceCommentsState} from './resource-comments.state';
import {ResourceCommentsAction, ResourceCommentsActionType} from './resource-comments.action';

export function resourceCommentsReducer(
  state: ResourceCommentsState = initialResourceCommentsState,
  action: ResourceCommentsAction.All
): ResourceCommentsState {
  switch (action.type) {
    case ResourceCommentsActionType.GET_SUCCESS:
      return resourceCommentsAdapter.upsertMany(action.payload.resourceComments, state);
    case ResourceCommentsActionType.CREATE:
      return resourceCommentsAdapter.upsertOne({...action.payload.comment, error: undefined}, state);
    case ResourceCommentsActionType.CREATE_SUCCESS:
      const newComment = {...action.payload.comment};
      delete newComment.correlationId;
      delete newComment.error;
      return resourceCommentsAdapter.upsertOne(
        newComment,
        resourceCommentsAdapter.removeOne(action.payload.comment.correlationId, state)
      );
    case ResourceCommentsActionType.CREATE_FAILURE:
      const currentComment = state.entities[action.payload.correlationId];
      return resourceCommentsAdapter.upsertOne({...currentComment, error: action.payload.correlationId}, state);
    case ResourceCommentsActionType.UPDATE:
      return resourceCommentsAdapter.upsertOne(action.payload.comment, state);
    case ResourceCommentsActionType.UPDATE_FAILURE:
      return resourceCommentsAdapter.upsertOne(action.payload.originalComment, state);
    case ResourceCommentsActionType.DELETE:
    case ResourceCommentsActionType.DELETE_UNINITIALIZED:
      return resourceCommentsAdapter.removeOne(
        action.payload.comment.correlationId || action.payload.comment.id,
        state
      );
    case ResourceCommentsActionType.DELETE_FAILURE:
      return resourceCommentsAdapter.upsertOne(action.payload.originalComment, state);
    default:
      return state;
  }
}
