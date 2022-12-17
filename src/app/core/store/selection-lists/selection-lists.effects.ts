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
import {convertSelectionListDtoToModel, convertSelectionListModelToDto} from './selection-list.converter';
import {createCallbackActions} from '../utils/store.utils';

@Injectable()
export class SelectionListsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.Get>(SelectionListsActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectSelectionListsLoadedOrganization))),
      filter(
        ([action, loadedOrganization]) => action.payload.force || loadedOrganization !== action.payload.organizationId
      ),
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

  public getOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.GetOne>(SelectionListsActionType.GET_ONE),
      mergeMap(action =>
        this.service.getOne(action.payload.organizationId, action.payload.selectionListId).pipe(
          map(dto => convertSelectionListDtoToModel(dto)),
          map(list => new SelectionListsAction.GetOneSuccess({list})),
          catchError(error => of(new SelectionListsAction.GetFailure({error})))
        )
      )
    )
  );

  public getByProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.GetByProject>(SelectionListsActionType.GET_BY_PROJECT),
      mergeMap(action =>
        this.service.getByProject(action.payload.organizationId, action.payload.projectId).pipe(
          map(dtos => dtos.map(dto => convertSelectionListDtoToModel(dto))),
          map(lists => new SelectionListsAction.GetByProjectSuccess({lists})),
          catchError(() => EMPTY)
        )
      )
    )
  );

  public createSampleLists$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.CreateSampleLists>(SelectionListsActionType.CREATE_SAMPLE_LISTS),
      mergeMap(action =>
        this.service.createSampleLists(action.payload.organizationId, action.payload.projectId).pipe(
          mergeMap(() => this.service.getByProject(action.payload.organizationId, action.payload.projectId)),
          map(dtos => dtos.map(dto => convertSelectionListDtoToModel(dto))),
          mergeMap(lists => [
            new SelectionListsAction.GetByProjectSuccess({lists}),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
          catchError(error =>
            of(
              new SelectionListsAction.CreateSampleListsFailure({error}),
              ...createCallbackActions(action.payload.onFailure)
            )
          )
        )
      )
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.Create>(SelectionListsActionType.CREATE),
      mergeMap(action => {
        const listDto = convertSelectionListModelToDto(action.payload.list);
        return this.service.create(action.payload.list.organizationId, listDto).pipe(
          map(dto => convertSelectionListDtoToModel(dto)),
          mergeMap(list => [
            new SelectionListsAction.CreateSuccess({list}),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
          catchError(error =>
            of(new SelectionListsAction.CreateFailure({error}), ...createCallbackActions(action.payload.onFailure))
          )
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
          mergeMap(list => [
            new SelectionListsAction.UpdateSuccess({list}),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
          catchError(error =>
            of(new SelectionListsAction.UpdateFailure({error}), ...createCallbackActions(action.payload.onFailure))
          )
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

  public deleteConfirm$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SelectionListsAction.DeleteConfirm>(SelectionListsActionType.DELETE_CONFIRM),
      map((action: SelectionListsAction.DeleteConfirm) => {
        const title = $localize`:@@selection.lists.delete.dialog.title:Remove selection list`;
        const message = $localize`:@@selection.lists.delete.dialog.message:Do you really want to remove this selection list? Attributes that use this selection list will retain its copy.`;

        return new NotificationsAction.Confirm({
          title,
          message,
          action: new SelectionListsAction.Delete(action.payload),
          type: 'danger',
        });
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
