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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {EMPTY, Observable, of, pipe} from 'rxjs';
import {catchError, concatMap, filter, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {Perspective} from '../../../view/perspectives/perspective';
import {PermissionDto, ViewDto} from '../../dto';
import {AppState} from '../app.state';
import {CommonAction} from '../common/common.action';
import {NavigationAction} from '../navigation/navigation.action';
import {selectNavigation} from '../navigation/navigation.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {Permission, PermissionType} from '../permissions/permissions';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {RouterAction} from '../router/router.action';
import {View} from './view';
import {
  convertDefaultViewConfigDtoToModel,
  convertDefaultViewConfigModelToDto,
  convertViewDtoToModel,
  convertViewModelToDto,
} from './view.converter';
import {ViewsAction, ViewsActionType} from './views.action';
import {selectViewsDictionary, selectViewsLoaded, selectViewsState} from './views.state';
import {areQueriesEqual} from '../navigation/query/query.helper';
import {Angulartics2} from 'angulartics2';
import {environment} from '../../../../environments/environment';
import mixpanel from 'mixpanel-browser';
import RemoveViewFromUrl = NavigationAction.RemoveViewFromUrl;
import {User} from '../users/user';
import {selectWorkspaceWithIds} from '../common/common.selectors';
import {convertUserModelToDto} from '../users/user.converter';
import {createCallbackActions} from '../store.utils';
import {mapPositionPathParams} from '../navigation/query/query.util';
import {SearchesAction} from '../searches/searches.action';
import {TablesAction} from '../tables/tables.action';
import {PivotsAction} from '../pivots/pivots.action';
import {GanttChartAction} from '../gantt-charts/gantt-charts.action';
import {MapsAction} from '../maps/maps.action';
import {CalendarsAction} from '../calendars/calendars.action';
import {KanbansAction} from '../kanbans/kanbans.action';
import {ChartAction} from '../charts/charts.action';
import {ViewService, UserService} from '../../data-service';
import {WorkflowsAction} from '../workflows/workflows.action';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {HttpErrorResponse} from '@angular/common/http';
import {UsersAction} from '../users/users.action';

@Injectable()
export class ViewsEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.Get>(ViewsActionType.GET),
    withLatestFrom(this.store$.pipe(select(selectViewsLoaded))),
    filter(([action, loaded]) => action.payload.force || !loaded),
    map(([action]) => action),
    mergeMap(action => {
      return this.viewService.getViews(action.payload.workspace).pipe(
        map((dtos: ViewDto[]) => dtos.map(dto => convertViewDtoToModel(dto))),
        map((views: View[]) => new ViewsAction.GetSuccess({views})),
        catchError(error => of(new ViewsAction.GetFailure({error})))
      );
    })
  );

  @Effect()
  public getOne$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.GetOne>(ViewsActionType.GET_BY_CODE),
    mergeMap(action =>
      this.viewService.getView(action.payload.viewId).pipe(
        map((dto: ViewDto) => convertViewDtoToModel(dto)),
        map((view: View) => new ViewsAction.GetSuccess({views: [view]})),
        catchError(error => of(new ViewsAction.GetFailure({error})))
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
      const viewDto = convertViewModelToDto(action.payload.view);
      const {onSuccess, onFailure, nextActions} = action.payload;

      return this.viewService.createView(viewDto).pipe(
        map(dto => convertViewDtoToModel(dto)),
        mergeMap(view => {
          const actions: Action[] = [new ViewsAction.CreateSuccess({view, nextActions})];
          if (onSuccess) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => onSuccess(view)}));
          }
          return actions;
        }),
        catchError(error => {
          const actions: Action[] = [new ViewsAction.CreateFailure({error})];
          if (onFailure) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure()}));
          }
          return of(...actions);
        })
      );
    })
  );

  @Effect()
  public createSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.CreateSuccess>(ViewsActionType.CREATE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectNavigation)), this.store$.pipe(select(selectViewsDictionary))),
    map(([action, navigation, views]) => {
      const paths: any[] = [
        'w',
        navigation.workspace.organizationCode,
        navigation.workspace.projectCode,
        'view',
        {vc: action.payload.view.code},
      ];
      if (navigation.searchTab) {
        paths.push(Perspective.Search);
        paths.push(navigation.searchTab);
      }
      if (navigation.mapPosition) {
        paths.push(Perspective.Map);
        paths.push(mapPositionPathParams(navigation.mapPosition));
      }
      if (environment.analytics) {
        this.angulartics2.eventTrack.next({
          action: 'View create',
          properties: {category: 'Application Resources', label: 'count', value: Object.keys(views).length + 1},
        });

        if (environment.mixpanelKey) {
          mixpanel.track('View Create', {
            count: Object.keys(views).length + 1,
            perspective: String(action.payload.view.perspective),
          });
        }
      }
      return new RouterAction.Go({
        path: paths,
        extras: {queryParamsHandling: 'merge'},
        nextActions: action.payload.nextActions,
      });
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
      const viewDto = convertViewModelToDto(action.payload.view);
      const {onSuccess, onFailure} = action.payload;

      return this.viewService.updateView(action.payload.viewId, viewDto).pipe(
        map(dto => convertViewDtoToModel(dto)),
        mergeMap(view => {
          const actions: Action[] = [new ViewsAction.UpdateSuccess({view: view})];
          if (onSuccess) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => onSuccess()}));
          }
          return actions;
        }),
        catchError(error => {
          const actions: Action[] = [new ViewsAction.UpdateFailure({error})];
          if (onFailure) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure()}));
          }
          return of(...actions);
        })
      );
    })
  );

  @Effect()
  public updateSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.UpdateSuccess>(ViewsActionType.UPDATE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectNavigation))),
    mergeMap(([action, navigation]) => {
      const viewCodeInUrl = navigation && navigation.workspace && navigation.workspace.viewCode;
      const {code, query} = action.payload.view;
      if (viewCodeInUrl && viewCodeInUrl === code && !areQueriesEqual(query, navigation.query)) {
        return [new NavigationAction.SetQuery({query})];
      }
      return [];
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
  public resetViewConfig$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.ResetViewConfig>(ViewsActionType.RESET_VIEW_CONFIG),
    withLatestFrom(this.store$.pipe(select(selectViewsDictionary))),
    filter(([action, viewsMap]) => !!viewsMap[action.payload.viewId]),
    mergeMap(([action, viewsMap]) => {
      const view = viewsMap[action.payload.viewId];

      switch (view.perspective) {
        case Perspective.Search:
          const searchConfig = view.config?.search;
          return of(new SearchesAction.SetConfig({searchId: view.code, config: searchConfig}));
        case Perspective.Table:
          const tableConfig = view.config?.table;
          return of(new TablesAction.SetConfig({tableId: view.code, config: tableConfig}));
        case Perspective.Pivot:
          const pivotConfig = view.config?.pivot;
          return of(new PivotsAction.SetConfig({pivotId: view.code, config: pivotConfig}));
        case Perspective.GanttChart:
          const ganttConfig = view.config?.ganttChart;
          return of(new GanttChartAction.SetConfig({ganttChartId: view.code, config: ganttConfig}));
        case Perspective.Map:
          const mapConfig = view.config?.map;
          return of(new MapsAction.SetConfig({mapId: view.code, config: mapConfig}));
        case Perspective.Calendar:
          const calendarConfig = view.config?.calendar;
          return of(new CalendarsAction.SetConfig({calendarId: view.code, config: calendarConfig}));
        case Perspective.Kanban:
          const kanbanConfig = view.config?.kanban;
          return of(new KanbansAction.SetConfig({kanbanId: view.code, config: kanbanConfig}));
        case Perspective.Chart:
          const chartConfig = view.config?.chart;
          return of(new ChartAction.SetConfig({chartId: view.code, config: chartConfig}));
        case Perspective.Workflow:
          const workflowConfig = view.config?.workflow;
          return of(new WorkflowsAction.SetConfig({workflowId: view.code, config: workflowConfig}));
        default:
          return EMPTY;
      }
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.Delete>(ViewsActionType.DELETE),
    withLatestFrom(this.store$.pipe(select(selectViewsDictionary))),
    filter(([action, viewsMap]) => !!viewsMap[action.payload.viewId]),
    mergeMap(([action, viewsMap]) => {
      const view = viewsMap[action.payload.viewId];
      return this.viewService.deleteView(action.payload.viewId).pipe(
        map(() => new ViewsAction.DeleteSuccess({viewId: action.payload.viewId, viewCode: view.code})),
        catchError(error => of(new ViewsAction.DeleteFailure({error})))
      );
    })
  );

  @Effect()
  public deleteSuccess$ = this.actions$.pipe(
    ofType<ViewsAction.DeleteSuccess>(ViewsActionType.DELETE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectNavigation))),
    mergeMap(([action, navigation]) => {
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
  public setUserPermission$ = this.actions$.pipe(
    ofType<ViewsAction.SetUserPermissions>(ViewsActionType.SET_USER_PERMISSIONS),
    concatMap(action => {
      const {permissions, viewId, newUsers, newUsersRoles} = action.payload;

      return this.addUserToWorkspace(newUsers, newUsersRoles).pipe(
        mergeMap(newPermissions => {
          const permissionsDto: PermissionDto[] = [...permissions, ...newPermissions].map(model =>
            PermissionsConverter.toPermissionDto(model)
          );
          return this.viewService.updateUserPermission(viewId, permissionsDto);
        }),
        map(dtos => dtos.map(dto => PermissionsConverter.fromPermissionDto(dto))),
        concatMap(newPermissions =>
          of(
            new ViewsAction.SetPermissionsSuccess({viewId, permissions: newPermissions, type: PermissionType.Users}),
            ...createCallbackActions(action.payload.onSuccess)
          )
        ),
        catchError(error => {
          if (error instanceof HttpErrorResponse && Number(error.status) === 402) {
            return of(
              new ViewsAction.SetPermissionsFailure({error}),
              ...createCallbackActions(action.payload.onInviteFailure)
            );
          }
          return of(new ViewsAction.SetPermissionsFailure({error}), ...createCallbackActions(action.payload.onFailure));
        })
      );
    })
  );

  private addUserToWorkspace(newUsers: User[], newUsersRoles: Record<string, string[]>): Observable<Permission[]> {
    if (newUsers.length === 0) {
      return of([]);
    }

    const usersDtos = newUsers.map(user => convertUserModelToDto(user));
    return this.store$.select(pipe(selectWorkspaceWithIds)).pipe(
      take(1),
      mergeMap(workspace =>
        this.userService.createUserInWorkspace(workspace.organizationId, workspace.projectId, usersDtos)
      ),
      map(users =>
        users.map((user, index) => {
          const correlationId = newUsers[index].correlationId;
          const roles = newUsersRoles[correlationId];
          return {id: user.id, roles};
        })
      )
    );
  }

  @Effect()
  public setPermissionFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.SetPermissionsFailure>(ViewsActionType.SET_PERMISSIONS_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.pipe(select(selectOrganizationByWorkspace))),
    map(([action, organization]) => {
      if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
        return new UsersAction.InvitationExceeded({organizationId: organization.id});
      }
      const message = this.i18n({id: 'view.change.permission.fail', value: 'Could not change the view permissions'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public addFavorite$ = this.actions$.pipe(
    ofType<ViewsAction.AddFavorite>(ViewsActionType.ADD_FAVORITE),
    mergeMap(action =>
      this.viewService.addFavorite(action.payload.viewId, action.payload.workspace).pipe(
        mergeMap(() => of()),
        catchError(error =>
          of(
            new ViewsAction.AddFavoriteFailure({
              viewId: action.payload.viewId,
              error,
            })
          )
        )
      )
    )
  );

  @Effect()
  public addFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.AddFavoriteFailure>(ViewsActionType.ADD_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'view.add.favorite.fail', value: 'Could not add the view to favorites'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public removeFavorite$ = this.actions$.pipe(
    ofType<ViewsAction.RemoveFavorite>(ViewsActionType.REMOVE_FAVORITE),
    mergeMap(action =>
      this.viewService.removeFavorite(action.payload.viewId, action.payload.workspace).pipe(
        mergeMap(() => of()),
        catchError(error =>
          of(
            new ViewsAction.RemoveFavoriteFailure({
              viewId: action.payload.viewId,
              error,
            })
          )
        )
      )
    )
  );

  @Effect()
  public removeFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.RemoveFavoriteFailure>(ViewsActionType.REMOVE_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'view.remove.favorite.fail',
        value: 'Could not remove the view from favorites',
      });
      return new NotificationsAction.Error({message});
    })
  );

  @Effect({dispatch: false})
  public setDefaultConfig$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.SetDefaultConfig>(ViewsActionType.SET_DEFAULT_CONFIG),
    map(action => ({...action.payload.model, updatedAt: new Date()})),
    tap(model => this.store$.dispatch(new ViewsAction.SetDefaultConfigSuccess({model}))),
    mergeMap(model => {
      return this.viewService
        .updateDefaultConfig(
          convertDefaultViewConfigModelToDto({
            ...model,
            updatedAt: new Date(),
          })
        )
        .pipe(
          mergeMap(() => EMPTY),
          catchError(() => EMPTY)
        );
    })
  );

  @Effect()
  public getDefaultConfigs$: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.GetDefaultConfigs>(ViewsActionType.GET_DEFAULT_CONFIGS),
    mergeMap(action => {
      return this.viewService.getDefaultConfigs(action.payload.workspace).pipe(
        map(dtos => dtos.map(dto => convertDefaultViewConfigDtoToModel(dto))),
        map(configs => new ViewsAction.GetDefaultConfigsSuccess({configs})),
        catchError(() => of(new ViewsAction.GetDefaultConfigsSuccess({configs: []})))
      );
    })
  );

  @Effect()
  public resetDefaultConfigBySnapshot: Observable<Action> = this.actions$.pipe(
    ofType<ViewsAction.ResetDefaultConfigBySnapshot>(ViewsActionType.RESET_DEFAULT_CONFIG_BY_SNAPSHOT),
    withLatestFrom(this.store$.pipe(select(selectViewsState))),
    mergeMap(([action, viewsState]) => {
      const {defaultConfigSnapshot} = viewsState;
      if (!defaultConfigSnapshot || defaultConfigSnapshot.perspective !== action.payload.perspective) {
        return [];
      }

      return [
        new ViewsAction.SetDefaultConfig({model: defaultConfigSnapshot}),
        new ViewsAction.SetDefaultConfigSnapshot({}),
      ];
    })
  );

  constructor(
    private actions$: Actions,
    private i18n: I18n,
    private router: Router,
    private store$: Store<AppState>,
    private viewService: ViewService,
    private userService: UserService,
    private angulartics2: Angulartics2
  ) {}
}
