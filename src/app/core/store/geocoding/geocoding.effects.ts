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
import {Action, select, Store} from '@ngrx/store';
import {from, Observable} from 'rxjs';
import {catchError, map, mergeMap, take} from 'rxjs/operators';
import {createCallbackActions, emitErrorActions} from '../utils/store.utils';
import {GeocodingAction, GeocodingActionType} from './geocoding.action';
import {selectGeocodingQueryCoordinates, selectLocationByCoordinates, selectLocationsByQuery} from './geocoding.state';
import {GeocodingConverter} from './geocoding.converter';
import {GeocodingService} from '../../data-service';
import {AppState} from '../app.state';

@Injectable()
export class GeocodingEffects {
  public getCoordinates$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GeocodingAction.GetCoordinates>(GeocodingActionType.GET_COORDINATES),
      mergeMap(action => {
        const {queries, onSuccess, onFailure} = action.payload;
        return this.store$.pipe(
          select(selectGeocodingQueryCoordinates),
          take(1),
          mergeMap(queryCoordinates => {
            const missingQueries = queries.filter(query => !queryCoordinates[query]);
            if (missingQueries.length === 0) {
              return from(createCallbackActions(onSuccess, queryCoordinates));
            }

            return this.geocodingApiService.findCoordinates(missingQueries).pipe(
              mergeMap(coordinatesMap => [
                new GeocodingAction.GetCoordinatesSuccess({coordinatesMap}),
                ...createCallbackActions(onSuccess, coordinatesMap),
              ]),
              catchError(error => emitErrorActions(error, onFailure))
            );
          })
        );
      })
    )
  );

  public getLocation$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GeocodingAction.GetLocation>(GeocodingActionType.GET_LOCATION),
      mergeMap(action => {
        const {coordinates, onSuccess, onFailure} = action.payload;
        return this.store$.pipe(
          select(selectLocationByCoordinates(coordinates)),
          take(1),
          mergeMap(storedLocation => {
            if (storedLocation) {
              return from(createCallbackActions(onSuccess, storedLocation));
            }

            return this.geocodingApiService.findLocationByCoordinates(coordinates).pipe(
              mergeMap(location => [
                new GeocodingAction.GetLocationSuccess({
                  coordinates,
                  location: GeocodingConverter.fromDto(location),
                }),
                ...createCallbackActions(onSuccess, location),
              ]),
              catchError(error => emitErrorActions(error, onFailure))
            );
          })
        );
      })
    )
  );

  public getLocations$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GeocodingAction.GetLocations>(GeocodingActionType.GET_LOCATIONS),
      mergeMap(action => {
        const {query} = action.payload;
        return this.store$.pipe(
          select(selectLocationsByQuery(query)),
          take(1),
          mergeMap(storedLocations => {
            if (storedLocations) {
              return from([]);
            }

            return this.geocodingApiService
              .findLocations(query)
              .pipe(
                map(
                  locations =>
                    new GeocodingAction.GetLocationsSuccess({query, locations: GeocodingConverter.fromDtos(locations)})
                )
              );
          })
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private geocodingApiService: GeocodingService,
    private store$: Store<AppState>
  ) {}
}
