/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {VideoModel} from './video.model';
import {filterVideosByIds} from './videos.filters';
import {getVideosByUrl} from './videos.data';

export interface VideosState extends EntityState<VideoModel> {}

export const videosAdapter = createEntityAdapter<VideoModel>({selectId: video => video.id});

export const initialVideosState: VideosState = videosAdapter.getInitialState({});

export const selectVideosState = (state: AppState) => state.videos;
export const selectAllVideos = createSelector(
  selectVideosState,
  videosAdapter.getSelectors().selectAll
);
export const selectVideosByPriority = createSelector(
  selectAllVideos,
  videos => {
    return videos.sort((video1, video2) => video1.priority - video2.priority);
  }
);
export const selectVideosDictionary = createSelector(
  selectVideosState,
  videosAdapter.getSelectors().selectEntities
);
export const selectVideoById = (id: string) =>
  createSelector(
    selectVideosDictionary,
    videosMap => videosMap[id]
  );
export const selectVideosByUrl = (url: string) =>
  createSelector(
    selectVideosByPriority,
    videos => filterVideosByIds(videos, getVideosByUrl(url))
  );
