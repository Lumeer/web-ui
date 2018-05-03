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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {catchError, flatMap, map, mergeMap, skipWhile, tap, withLatestFrom} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {View} from '../../dto';
import {SearchService, ViewService} from '../../rest';
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
  public get: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.Get>(ViewsActionType.GET),
    mergeMap((action) => {
      return this.searchService.searchViews(action.payload.query).pipe(
        map((dtos: View[]) => dtos.map(dto => ViewConverter.convertToModel(dto))),
        map((views: ViewModel[]) => new ViewsAction.GetSuccess({views})),
        catchError((error) => Observable.of(new ViewsAction.GetFailure({error: error})))
      );
    })
  );

  @Effect()
  public getByCode$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.GetByCode>(ViewsActionType.GET_BY_CODE),
    withLatestFrom(this.store$.select(selectViewsDictionary)),
    skipWhile(([action, views]) => action.payload.viewCode in views),
    mergeMap(([action]) => this.viewService.getView(action.payload.viewCode).pipe(
      skipWhile((dto: View) => isNullOrUndefined(dto)), // TODO can probably be removed once views are not stored in webstorage
      map((dto: View) => ViewConverter.convertToModel(dto)),
      map((view: ViewModel) => new ViewsAction.GetSuccess({views: [view]})),
      catchError((error) => Observable.of(new ViewsAction.GetFailure({error: error})))
    )),
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.GetFailure>(ViewsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'views.get.fail', value: 'Failed to get views'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.Create>(ViewsActionType.CREATE),
    mergeMap(action => {
      const viewDto = ViewConverter.convertToDto(action.payload.view);

      return this.viewService.createView(viewDto).pipe(
        map(dto => ViewConverter.convertToModel(dto)),
        map(view => new ViewsAction.CreateSuccess({view: view})),
        catchError((error) => Observable.of(new ViewsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(ViewsActionType.CREATE_SUCCESS),
    withLatestFrom(this.store$.select(selectWorkspace)),
    flatMap(([action, workspace]: [ViewsAction.CreateSuccess, Workspace]) => {
      const message = this.i18n({id: 'view.create.success', value: 'View has been created'});
      return [
        new NotificationsAction.Success({message}),
        new RouterAction.Go({path: ['w', workspace.organizationCode, workspace.projectCode, 'view', {vc: action.payload.view.code}]})
      ];
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.CreateFailure>(ViewsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'view.create.fail', value: 'Failed to create view'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.Update>(ViewsActionType.UPDATE),
    mergeMap(action => {
      const viewDto = ViewConverter.convertToDto(action.payload.view);

      return this.viewService.updateView(action.payload.viewCode, viewDto).pipe(
          map(dto => ViewConverter.convertToModel(dto)),
          map((view) => new ViewsAction.UpdateSuccess({view: view, nextAction: action.payload.nextAction})),
          catchError((error) => Observable.of(new ViewsAction.UpdateFailure({error: error})))
      );
    }),
  );

  @Effect()
  public updateSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.UpdateSuccess>(ViewsActionType.UPDATE_SUCCESS),
    tap(action => {
      if (action.payload.nextAction) {
        this.store$.dispatch(action.payload.nextAction);
      }
    }),
    map(() => {
      const message = this.i18n({id: 'view.update.success', value: 'View has been updated'});
      return new NotificationsAction.Success({message});
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.UpdateFailure>(ViewsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'view.update.fail', value: 'Failed to update view'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private i18n: I18n,
              private store$: Store<AppState>,
              private viewService: ViewService,
              private searchService: SearchService) {
  }

}
