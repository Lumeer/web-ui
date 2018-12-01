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

import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {VideosAction, VideosActionType} from './videos.action';
import {VideoService} from '../../api/video/video.service';
import {VideoConverter} from './video.converter';

@Injectable()
export class VideosEffects {
  @Effect()
  public getVideos$: Observable<Action> = this.actions$.pipe(
    ofType<VideosAction.LoadVideos>(VideosActionType.LOAD_VIDEOS),
    mergeMap(action => {
      const keys = Object.keys(action.payload.videos).join(',');
      return this.videoService.getVideoMetadata(keys, action.payload.apiKey).pipe(
        map(videos => new VideosAction.RegisterVideos({videos: VideoConverter.fromDto(videos, action.payload.videos)})),
        catchError(error => of(new VideosAction.LoadVideosFailure({error: error})))
      );
    })
  );

  @Effect()
  public loadVideosFailure$: Observable<Action> = this.actions$.pipe(
    ofType<VideosAction.LoadVideosFailure>(VideosActionType.LOAD_VIDEOS_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'video.metadata.get.fail',
        value:
          'Unable to read training videos. I am sorry, the videos will not be available now. The problem is being worked on.',
      });
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private videoService: VideoService
  ) {}
}
