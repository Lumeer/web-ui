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

import {Injectable} from '@angular/core';
import {Actions, Effect} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, flatMap, map, skipWhile, switchMap, withLatestFrom} from 'rxjs/operators';
import {View} from '../../dto/view';
import {ViewService} from '../../rest/view.service';
import {AppState} from '../app.state';
import {selectWorkspace} from '../navigation/navigation.state';
import {Workspace} from '../navigation/workspace.model';
import {NotificationsAction} from '../notifications/notifications.action';
import {RouterAction} from '../router/router.action';
import {ViewConverter} from './view.converter';
import {ViewModel} from './view.model';
import {ViewsAction, ViewsActionType} from './views.action';
import {selectViewsDictionary} from './views.state';

@Injectable()
export class ViewsEffects {

  @Effect()
  public getByCode$: Observable<Action> = this.actions.ofType<ViewsAction.GetByCode>(ViewsActionType.GET_BY_CODE).pipe(
    withLatestFrom(this.store.select(selectViewsDictionary)),
    skipWhile(([action, views]) => action.payload.viewCode in views),
    switchMap(([action, views]) => this.viewService.getView(action.payload.viewCode)),
    map((dto: View) => ViewConverter.convertToModel(dto)),
    map((view: ViewModel) => new ViewsAction.GetSuccess({views: [view]})),
    catchError(() => Observable.of(new ViewsAction.GetFailure()))
  );

  @Effect()
  public create$: Observable<Action> = this.actions.ofType<ViewsAction.Create>(ViewsActionType.CREATE).pipe(
    map(action => ViewConverter.convertToDto(action.payload.view)),
    switchMap(dto => this.viewService.createView(dto)),
    map(dto => ViewConverter.convertToModel(dto)),
    map(view => new ViewsAction.CreateSuccess({view: view})),
    catchError(() => Observable.of(new ViewsAction.CreateFailure()))
  );

  @Effect()
  public createSuccess$: Observable<Action> = this.actions.ofType(ViewsActionType.CREATE_SUCCESS).pipe(
    withLatestFrom(this.store.select(selectWorkspace)),
    flatMap(([action, workspace]: [ViewsAction.CreateSuccess, Workspace]) => [
      new NotificationsAction.Success({message: 'View has been created'}),
      new RouterAction.Go({path: ['w', workspace.organizationCode, workspace.projectCode, 'view', {vc: action.payload.view.code}]})
    ])
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions.ofType(ViewsActionType.CREATE_FAILURE).pipe(
    map(action => new NotificationsAction.Error({message: 'Failed to create view'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions.ofType<ViewsAction.Update>(ViewsActionType.UPDATE).pipe(
    map(action => [action.payload.viewCode, ViewConverter.convertToDto(action.payload.view)]),
    switchMap(([code, dto]: [string, View]) => this.viewService.updateView(code, dto)),
    map(dto => ViewConverter.convertToModel(dto)),
    map(view => new ViewsAction.UpdateSuccess({view: view})),
    catchError(() => Observable.of(new ViewsAction.UpdateFailure()))
  );

  @Effect()
  public updateSuccess$: Observable<Action> = this.actions.ofType(ViewsActionType.UPDATE_SUCCESS).pipe(
    map(view => new NotificationsAction.Success({message: 'View has been updated'}))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions.ofType(ViewsActionType.UPDATE_FAILURE).pipe(
    map(view => new NotificationsAction.Error({message: 'Failed to update view'}))
  );

  constructor(private actions: Actions,
              private store: Store<AppState>,
              private viewService: ViewService) {
  }

}
