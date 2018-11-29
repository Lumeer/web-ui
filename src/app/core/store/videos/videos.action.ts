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
  SET_VIDEOS = '[Videos] Set Videos',
  LOAD_VIDEO = '[Videos] Load Video',
  LOAD_VIDEO_FAILURE = '[Videos] Load Video Failure',
  REGISTER_VIDEO = '[Videos] Register Video',
}

export namespace VideosAction {
  export class ClearVideos implements Action {
    public readonly type = VideosActionType.CLEAR_VIDEOS;

    public constructor() {}
  }

  export class SetVideos implements Action {
    public readonly type = VideosActionType.SET_VIDEOS;

    public constructor(public payload: {videos: VideoModel[]}) {}
  }

  export class LoadVideo implements Action {
    public readonly type = VideosActionType.LOAD_VIDEO;

    public constructor(public payload: {id: string; apiKey: string}) {}
  }

  export class LoadVideoFailure implements Action {
    public readonly type = VideosActionType.LOAD_VIDEO_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class RegisterVideo implements Action {
    public readonly type = VideosActionType.REGISTER_VIDEO;

    public constructor(public payload: VideoModel) {}
  }

  export type All = ClearVideos | SetVideos | LoadVideo | LoadVideoFailure | RegisterVideo;
}
