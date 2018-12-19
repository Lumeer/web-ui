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
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, of} from 'rxjs';
import {catchError, concatMap, filter, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {PermissionDto, ViewDto} from '../../dto';
import {ViewService} from '../../rest';
import {AppState} from '../app.state';
import {selectNavigation, selectSearchTab, selectWorkspace} from '../navigation/navigation.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {RouterAction} from '../router/router.action';
import {ViewConverter} from './view.converter';
import {View} from './view';
import {ViewsAction, ViewsActionType} from './views.action';
import {selectViewsDictionary, selectViewsLoaded} from './views.state';
import {Perspective} from '../../../view/perspectives/perspective';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {PermissionType} from '../permissions/permissions';
import {NavigationAction} from '../navigation/navigation.action';
import RemoveViewFromUrl = NavigationAction.RemoveViewFromUrl;
import {Router} from '@angular/router';

@Injectable()
export class ViewsEffects {
  @Effect()
  public get: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.Get>(ViewsActionType.GET),
    withLatestFrom(this.store$.pipe(select(selectViewsLoaded))),
    filter(([action, loaded]) => action.payload.force || !loaded),
    mergeMap(() => {
      return this.viewService.getViews().pipe(
        map((dtos: ViewDto[]) => dtos.map(dto => ViewConverter.convertToModel(dto))),
        map((views: View[]) => new ViewsAction.GetSuccess({views})),
        catchError(error => of(new ViewsAction.GetFailure({error: error})))
      );
    })
  );

  @Effect()
  public getByCode$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.GetByCode>(ViewsActionType.GET_BY_CODE),
    withLatestFrom(this.store$.pipe(select(selectViewsDictionary))),
    filter(([action, views]) => !(action.payload.viewCode in views)),
    mergeMap(([action]) =>
      this.viewService.getView(action.payload.viewCode).pipe(
        map((dto: ViewDto) => ViewConverter.convertToModel(dto)),
        map((view: View) => new ViewsAction.GetSuccess({views: [view]})),
        catchError(error => of(new ViewsAction.GetFailure({error: error})))
      )
    )
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.GetFailure>(ViewsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'views.get.fail', value: 'Could not get views'});
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
        catchError(error => of(new ViewsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.CreateSuccess>(ViewsActionType.CREATE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectWorkspace)), this.store$.pipe(select(selectSearchTab))),
    map(([action, workspace, searchTab]) => {
      const paths = ['w', workspace.organizationCode, workspace.projectCode, 'view', {vc: action.payload.view.code}];
      if (searchTab) {
        paths.push(Perspective.Search);
        paths.push(searchTab);
      }
      return new RouterAction.Go({path: paths, extras: {queryParamsHandling: 'merge'}});
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.CreateFailure>(ViewsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'view.create.fail', value: 'Could not create the view'});
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
        map(view => new ViewsAction.UpdateSuccess({view: view, nextAction: action.payload.nextAction})),
        catchError(error => of(new ViewsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.UpdateFailure>(ViewsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'view.update.fail', value: 'Could not update the view'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.Delete>(ViewsActionType.DELETE),
    mergeMap(action => {
      return this.viewService.deleteView(action.payload.viewCode).pipe(
        map(() => new ViewsAction.DeleteSuccess(action.payload)),
        catchError(error => of(new ViewsAction.DeleteFailure({error: error})))
      );
    })
  );

  @Effect()
  public deleteSuccess$ = this.actions$.pipe(
    ofType<ViewsAction.DeleteSuccess>(ViewsActionType.DELETE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectNavigation))),
    flatMap(([action, navigation]) => {
      const viewCodeInUrl = navigation && navigation.workspace && navigation.workspace.viewCode;
      if (viewCodeInUrl && viewCodeInUrl === action.payload.viewCode) {
        return [new RemoveViewFromUrl({})];
      }
      return [];
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.DeleteFailure>(ViewsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'view.delete.fail', value: 'Could not delete the view'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public setPermission$ = this.actions$.pipe(
    ofType<ViewsAction.SetPermissions>(ViewsActionType.SET_PERMISSIONS),
    concatMap(action => {
      const permissionsDto: PermissionDto[] = action.payload.permissions.map(model =>
        PermissionsConverter.toPermissionDto(model)
      );

      let observable;
      if (action.payload.type === PermissionType.Users) {
        observable = this.viewService.updateUserPermission(permissionsDto);
      } else {
        observable = this.viewService.updateGroupPermission(permissionsDto);
      }
      return observable.pipe(
        concatMap(() => of(new ViewsAction.SetPermissionsSuccess(action.payload))),
        catchError(error => of(new ViewsAction.SetPermissionsFailure({error})))
      );
    })
  );

  @Effect()
  public setPermissionFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.SetPermissionsFailure>(ViewsActionType.SET_PERMISSIONS_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'view.change.permission.fail', value: 'Could not change the view permissions'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private actions$: Actions,
    private i18n: I18n,
    private router: Router,
    private store$: Store<AppState>,
    private viewService: ViewService
  ) {}
}
