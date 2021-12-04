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
import {select, Store} from '@ngrx/store';
import {AppState} from '../app.state';
import {Router} from '@angular/router';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {EMPTY, of} from 'rxjs';
import * as ResourceVariableActions from './resource-variables.actions';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectResourceVariablesDictionary, selectResourceVariablesLoadedProjects} from './resource-variables.state';
import {ResourceVariablesService} from '../../data-service/resource-variables/resource-variables.service';
import {convertResourceVariableDtoToModel, convertResourceVariableModelToDto} from './resource-variable.converter';

@Injectable()
export class ResourceVariablesEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.get),
      withLatestFrom(this.store$.pipe(select(selectResourceVariablesLoadedProjects))),
      filter(([action, loadedProjects]) => !loadedProjects.includes(action.workspace.projectId)),
      mergeMap(([action]) =>
        this.service.get(action.workspace.organizationId, action.workspace.projectId).pipe(
          map(dtos => dtos.map(dto => convertResourceVariableDtoToModel(dto))),
          map(variables => ResourceVariableActions.getSuccess({variables, workspace: action.workspace})),
          catchError(error => of(ResourceVariableActions.getFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.getFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@resource.variables.get.fail:Could not read variables`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.getOne),
      mergeMap(action =>
        this.service.getOne(action.workspace.organizationId, action.id).pipe(
          map(dto => convertResourceVariableDtoToModel(dto)),
          map(variable => ResourceVariableActions.getOneSuccess({variable})),
          catchError(() => EMPTY)
        )
      )
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.create),
      mergeMap(action => {
        const variableDto = convertResourceVariableModelToDto(action.variable);
        return this.service.create(variableDto).pipe(
          map(dto => convertResourceVariableDtoToModel(dto, action.variable.value)),
          mergeMap(variable => [ResourceVariableActions.createSuccess({variable})]),
          catchError(error => of(ResourceVariableActions.createFailure({error})))
        );
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.createFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@resource.variables.create.fail:Could not create variable`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.update),
      withLatestFrom(this.store$.pipe(select(selectResourceVariablesDictionary))),
      mergeMap(([action, variablesMap]) => {
        this.store$.dispatch(ResourceVariableActions.updateSuccess({variable: action.variable}));
        const currentVariable = variablesMap[action.variable.id];

        const variableDto = convertResourceVariableModelToDto(action.variable);
        return this.service.update(action.variable.id, variableDto).pipe(
          mergeMap(() => EMPTY),
          catchError(error => of(ResourceVariableActions.updateFailure({error, variable: currentVariable})))
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.updateFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@resource.variables.update.fail:Could not update variable`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public deleteConfirm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.deleteConfirm),
      map(action => {
        const title = $localize`:@@resource.variables.delete.confirm.title:Delete variable`;
        const message = $localize`:@@document.variables.delete.confirm.message:Do you really want to delete this variable?`;

        return new NotificationsAction.Confirm({
          title,
          message,
          action: ResourceVariableActions.deleteVariable({variable: action.variable}),
          type: 'danger',
        });
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.deleteVariable),
      withLatestFrom(this.store$.pipe(select(selectResourceVariablesDictionary))),
      mergeMap(([action, variablesMap]) => {
        this.store$.dispatch(ResourceVariableActions.deleteSuccess({id: action.variable.id}));
        const currentVariable = variablesMap[action.variable.id];

        return this.service.delete(action.variable.organizationId, action.variable.id).pipe(
          mergeMap(() => EMPTY),
          catchError(error => of(ResourceVariableActions.deleteFailure({error, variable: currentVariable})))
        );
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResourceVariableActions.deleteFailure),
      tap(action => console.error(action.error)),
      map(() => {
        const message = $localize`:@@resource.variables.delete.fail:Could not delete variable`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private service: ResourceVariablesService
  ) {}
}
