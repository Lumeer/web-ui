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
import {VideoService} from '../../rest/video.service';
import {VideoConverter} from './video.converter';

@Injectable()
export class VideosEffects {
  @Effect()
  public getVideo$: Observable<Action> = this.actions$.pipe(
    ofType<VideosAction.LoadVideo>(VideosActionType.LOAD_VIDEO),
    mergeMap(action =>
      this.videoService.getVideoMetadata(action.payload.id, action.payload.apiKey).pipe(
        map(video => new VideosAction.RegisterVideo(VideoConverter.fromDto(video))),
        catchError(error => of(new VideosAction.LoadVideoFailure({error: error})))
      )
    )
  );

  @Effect()
  public loadVideoFailure$: Observable<Action> = this.actions$.pipe(
    ofType<VideosAction.LoadVideoFailure>(VideosActionType.LOAD_VIDEO_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'video.metadata.get.fail',
        value: 'Unable to read instructions video information',
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
