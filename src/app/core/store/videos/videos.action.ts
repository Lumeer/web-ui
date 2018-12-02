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

import {VideoModel} from './video.model';
import {Action} from '@ngrx/store';

export enum VideosActionType {
  CLEAR_VIDEOS = '[Videos] Clear Videos',
  LOAD_VIDEOS = '[Videos] Load Videos',
  LOAD_VIDEOS_FAILURE = '[Videos] Load Video Failure',
  REGISTER_VIDEOS = '[Videos] Register Video',
}

export namespace VideosAction {
  export class ClearVideos implements Action {
    public readonly type = VideosActionType.CLEAR_VIDEOS;
  }

  export class LoadVideos implements Action {
    public readonly type = VideosActionType.LOAD_VIDEOS;

    public constructor(public payload: {videos: {[id: string]: number}; apiKey: string}) {}
  }

  export class LoadVideosFailure implements Action {
    public readonly type = VideosActionType.LOAD_VIDEOS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class RegisterVideos implements Action {
    public readonly type = VideosActionType.REGISTER_VIDEOS;

    public constructor(public payload: {videos: VideoModel[]}) {}
  }

  export type All = ClearVideos | LoadVideos | LoadVideosFailure | RegisterVideos;
}
