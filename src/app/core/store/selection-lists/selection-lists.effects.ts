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
import {EMPTY, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../app.state';
import {Router} from '@angular/router';
import {NotificationsAction} from '../notifications/notifications.action';
import {SelectionListsAction, SelectionListsActionType} from './selection-lists.action';
import {selectSelectionListsLoadedOrganization} from './selection-lists.state';
import {SelectionListsService} from '../../data-service/selection-lists/selection-lists.service';
import {convertSelectionListDtoToModel} from './selection-list.converter';

@Injectable()
export class SelectionListsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.Get>(SelectionListsActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectSelectionListsLoadedOrganization))),
      filter(([, loaded]) => !loaded),
      mergeMap(([action]) =>
        this.service.get(action.payload.organizationId).pipe(
          map(dtos => dtos.map(dto => convertSelectionListDtoToModel(dto))),
          map(
            lists =>
              new SelectionListsAction.GetSuccess({
                lists,
                organizationId: action.payload.organizationId,
              })
          ),
          catchError(error => of(new SelectionListsAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.GetFailure>(SelectionListsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@selection.lists.get.fail:Could not read selection lists`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.Create>(SelectionListsActionType.CREATE),
      mergeMap(action => {
        const listDto = convertSelectionListDtoToModel(action.payload.list);
        return this.service.create(action.payload.list.organizationId, listDto).pipe(
          map(dto => convertSelectionListDtoToModel(dto)),
          map(list => new SelectionListsAction.CreateSuccess({list})),
          catchError(error => of(new SelectionListsAction.CreateFailure({error})))
        );
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.CreateFailure>(SelectionListsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@selection.lists.create.fail:Could not create selection list`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.Update>(SelectionListsActionType.UPDATE),
      mergeMap(action => {
        const listDto = convertSelectionListDtoToModel(action.payload.list);
        return this.service.update(action.payload.list.organizationId, listDto.id, listDto).pipe(
          map(dto => convertSelectionListDtoToModel(dto)),
          map(list => new SelectionListsAction.UpdateSuccess({list})),
          catchError(error => of(new SelectionListsAction.UpdateFailure({error})))
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.UpdateFailure>(SelectionListsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@selection.lists.update.fail:Could not update selection list`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.Delete>(SelectionListsActionType.DELETE),
      tap(action => this.store$.dispatch(new SelectionListsAction.DeleteSuccess({id: action.payload.list.id}))),
      mergeMap(action => {
        const {list} = action.payload;

        return this.service.delete(list.organizationId, list.id).pipe(
          mergeMap(() => EMPTY),
          catchError(error => of(new SelectionListsAction.DeleteFailure({error, list})))
        );
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.DeleteFailure>(SelectionListsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@selection.lists.delete.fail:Could not delete selection list`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private service: SelectionListsService
  ) {}
}
