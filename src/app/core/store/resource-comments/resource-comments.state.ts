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
import {EntityState, createEntityAdapter} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';

import {ResourceType} from '../../model/resource-type';
import {AppState} from '../app.state';
import {ResourceCommentModel} from './resource-comment.model';

export interface ResourceCommentsState extends EntityState<ResourceCommentModel> {}

export const resourceCommentsAdapter = createEntityAdapter<ResourceCommentModel>({
  selectId: comment => comment.id || comment.correlationId,
});

export const initialResourceCommentsState: ResourceCommentsState = resourceCommentsAdapter.getInitialState({});

export const selectResourceCommentsState = (state: AppState) => state.resourceComments;

export const selectAllResourceComments = createSelector(
  selectResourceCommentsState,
  resourceCommentsAdapter.getSelectors().selectAll
);
export const selectResourceCommentsDictionary = createSelector(
  selectResourceCommentsState,
  resourceCommentsAdapter.getSelectors().selectEntities
);

export const selectResourceCommentsByResource = (
  resourceType: ResourceType,
  resourceId: string,
  pageStart?: number,
  pageLength?: number
) =>
  createSelector(selectAllResourceComments, comments => {
    const allComments = comments
      .filter(comment => comment.resourceType === resourceType && comment.resourceId === resourceId)
      .sort((comment1, comment2) => (comment2.creationDate?.getTime() || 0) - (comment1.creationDate?.getTime() || 0));

    if (pageStart || pageLength) {
      return allComments.slice(pageStart, pageStart + pageLength + 1);
    }

    return allComments;
  });
