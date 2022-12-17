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
import {Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {EMPTY, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {dashboardDataSelectorId, selectDashboardDataEntities, selectDashboardDataLoaded} from './dashboard-data.state';
import * as DashboardDataActions from './../dashboard-data/dashboard-data.actions';
import {DashboardDataService} from '../../data-service/dashboard-data/dashboard-data.service';
import {convertDashboardDataDtoToModel, convertDashboardDataModelToDto} from './dashboard-data.converter';
import {checkDeletedDashboardData} from './dashboard-data.utils';

@Injectable()
export class DashboardDataEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardDataActions.get),
      withLatestFrom(this.store$.pipe(select(selectDashboardDataLoaded))),
      filter(([action, loaded]) => action.force || !loaded),
      mergeMap(([action]) =>
        this.service.getAll(action.workspace).pipe(
          map(dtos => dtos.map(dto => convertDashboardDataDtoToModel(dto))),
          map(data => DashboardDataActions.getSuccess({data})),
          catchError(error => of(DashboardDataActions.getFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardDataActions.getFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@dashboard.data.get.fail:Could not read dashboard data`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardDataActions.getOne),
      mergeMap(action =>
        this.service.getOne(action.dataType, action.id, action.workspace).pipe(
          map(dto => convertDashboardDataDtoToModel(dto)),
          map(data => DashboardDataActions.getOneSuccess({data})),
          catchError(error => of(DashboardDataActions.getFailure({error})))
        )
      )
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardDataActions.update),
      withLatestFrom(this.store$.pipe(select(selectDashboardDataEntities))),
      tap(([action]) =>
        this.store$.dispatch(DashboardDataActions.updateSuccess({dashboardData: action.dashboardData}))
      ),
      mergeMap(([action, entities]) => {
        const dataDto = convertDashboardDataModelToDto(action.dashboardData);
        const originalDashboardData = entities[dashboardDataSelectorId(action.dashboardData)] || {
          ...action.dashboardData,
          data: undefined,
        };

        return this.service.update(dataDto).pipe(
          mergeMap(() => EMPTY),
          catchError(error => of(DashboardDataActions.updateFailure({error, dashboardData: originalDashboardData})))
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardDataActions.updateFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@dashboard.data.update.fail:Could not update dashboard data`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public checkDeletedData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardDataActions.checkDeletedData),
      mergeMap(action => {
        const deletedData = checkDeletedDashboardData(action.oldDashboard, action.currentDashboard);
        if (deletedData.ids.length) {
          return of(DashboardDataActions.deleteData({dataType: deletedData.type, ids: deletedData.ids}));
        }

        return EMPTY;
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardDataActions.deleteData),
      mergeMap(action => {
        return this.service.deleteByType(action.dataType, action.ids).pipe(
          map(() => DashboardDataActions.deleteDataSuccess({...action})),
          catchError(() => EMPTY)
        );
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private service: DashboardDataService
  ) {}
}
