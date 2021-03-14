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
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {ContentService} from '../../rest/content.service';
import {EMPTY, Observable, of} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {catchError, map, mergeMap, withLatestFrom} from 'rxjs/operators';
import {MapsAction, MapsActionType} from './maps.action';
import {AppState} from '../app.state';
import {selectMapsState} from './maps.state';
import {DomSanitizer} from '@angular/platform-browser';
import {MapImageLoadResult, supportedImageMimeTypes, supportedImageSize} from './map.model';
import {MimeType, mimeTypesMap} from '../../model/mime-type';
import DOMPurify from 'dompurify';

@Injectable()
export class MapsEffects {
  public downloadImageData$ = createEffect(() =>
    this.actions$.pipe(
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
                mergeMap(data => checkSvgSize(data)),
                map(data => ({...data, mimeType})),
                mergeMap(data => [
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
              mergeMap(data => checkBlobUrlSize(data)),
              map(data => ({...data, mimeType})),
              mergeMap(data => [
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
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private domSanitizer: DomSanitizer,
    private contentService: ContentService
  ) {}
}

function checkBlobUrlSize(data: string): Observable<{data: string; width: number; height: number}> {
  return new Observable(subscriber => {
    const image = new Image();
    image.src = data;
    image.onload = function () {
      subscriber.next({data, width: image.width, height: image.height});
      subscriber.complete();
    };
    image.onerror = function (error) {
      subscriber.error(error);
    };
  });
}

function checkSvgSize(data: string): Observable<{data: string; width: number; height: number}> {
  return new Observable(subscriber => {
    const onlySvgString = data.match(/<svg.*?>/)?.[0];
    let foundSize = false;
    if (onlySvgString) {
      const document = new DOMParser().parseFromString(onlySvgString + '</svg>', 'image/svg+xml');
      const svgImage = document.childNodes.item(0) as SVGElement;
      const width = +svgImage.getAttribute('width');
      const height = +svgImage.getAttribute('height');
      if (width > 0 && height > 0) {
        foundSize = true;
        subscriber.next({data, width, height});
        subscriber.complete();
      }
    }

    if (!foundSize) {
      subscriber.error(new Error());
    }
  });
}

function imageLoadedActions(url: string, result: MapImageLoadResult): Action[] {
  return [new MapsAction.SetImageDataLoading({url, loading: false}), new MapsAction.SetImageDataLoaded({url, result})];
}
