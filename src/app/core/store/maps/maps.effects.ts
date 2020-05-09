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

import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {ContentService} from '../../rest/content.service';
import {EMPTY, Observable, of} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {catchError, flatMap, map, mergeMap, withLatestFrom} from 'rxjs/operators';
import {MapsAction, MapsActionType} from './maps.action';
import {AppState} from '../app.state';
import {selectMapsState} from './maps.state';
import {DomSanitizer} from '@angular/platform-browser';
import {MapImageLoadResult, supportedImageMimeTypes, supportedImageSize} from './map.model';
import {MimeType, mimeTypesMap} from '../../model/mime-type';
import DOMPurify from 'dompurify';

@Injectable()
export class MapsEffects {
  @Effect()
  public downloadImageData$: Observable<Action> = this.actions$.pipe(
    ofType<MapsAction.DownloadImageData>(MapsActionType.DOWNLOAD_IMAGE_DATA),
    withLatestFrom(this.store$.pipe(select(selectMapsState))),
    mergeMap(([action, mapState]) => {
      const {url} = action.payload;
      if (!!mapState.imagesLoaded[url] || mapState.imagesLoading.includes(url)) {
        return EMPTY;
      }

      this.store$.dispatch(new MapsAction.SetImageDataLoading({url, loading: true}));

      return this.contentService.getDataSize(url).pipe(
        mergeMap(response => {
          const mimeType = mimeTypesMap[response.mimeType];
          if (!mimeType || !supportedImageMimeTypes.includes(mimeType)) {
            return imageLoadedActions(url, MapImageLoadResult.NotSupported);
          }
          if (response.size > supportedImageSize) {
            return imageLoadedActions(url, MapImageLoadResult.SizeExceeded);
          }

          if (mimeType === MimeType.Svg) {
            return this.contentService.downloadData(url).pipe(
              map(data => DOMPurify.sanitize(data)),
              map(data => ({mimeType, data})),
              flatMap(data => [
                new MapsAction.DownloadImageDataSuccess({
                  url,
                  data,
                }),
                ...imageLoadedActions(url, MapImageLoadResult.Success),
              ])
            );
          }

          return this.contentService.downloadBlob(url).pipe(
            map(blob => URL.createObjectURL(blob)),
            map(data => ({mimeType, data})),
            flatMap(data => [
              new MapsAction.DownloadImageDataSuccess({
                url,
                data,
              }),
              ...imageLoadedActions(url, MapImageLoadResult.Success),
            ])
          );
        }),
        catchError(() => of(...imageLoadedActions(url, MapImageLoadResult.FetchFailure)))
      );
    })
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private domSanitizer: DomSanitizer,
    private contentService: ContentService
  ) {}
}

function imageLoadedActions(url: string, result: MapImageLoadResult): Action[] {
  return [new MapsAction.SetImageDataLoading({url, loading: false}), new MapsAction.SetImageDataLoaded({url, result})];
}
