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
import {Action, select, Store} from '@ngrx/store';
import {combineLatest, EMPTY, Observable, of, pipe} from 'rxjs';
import {catchError, concatMap, filter, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../../../view/perspectives/perspective';
import {PermissionDto, ViewDto} from '../../dto';
import {AppState} from '../app.state';
import {CommonAction} from '../common/common.action';
import {NavigationAction} from '../navigation/navigation.action';
import {selectNavigation} from '../navigation/navigation.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {Permission, Role} from '../permissions/permissions';
import {convertPermissionModelToDto, convertPermissionsDtoToModel} from '../permissions/permissions.converter';
import {RouterAction} from '../router/router.action';
import {DefaultViewConfig, View} from './view';
import {
  convertDefaultViewConfigDtoToModel,
  convertDefaultViewConfigModelToDto,
  convertViewDtoToModel,
  convertViewModelToDto,
} from './view.converter';
import {ViewsAction, ViewsActionType} from './views.action';
import {selectDefaultViewConfig, selectViewsDictionary, selectViewsLoaded, selectViewsState} from './views.state';
import {areQueriesEqual} from '../navigation/query/query.helper';
import {Angulartics2} from 'angulartics2';
import mixpanel from 'mixpanel-browser';
import RemoveViewFromUrl = NavigationAction.RemoveViewFromUrl;
import {User} from '../users/user';
import {selectWorkspaceWithIds} from '../common/common.selectors';
import {convertUserModelToDto} from '../users/user.converter';
import {createCallbackActions} from '../utils/store.utils';
import {cleanQueryFromHiddenAttributes, mapPositionPathParams} from '../navigation/query/query.util';
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
import {ConfigurationService} from '../../../configuration/configuration.service';
import * as DetailActions from './../details/detail.actions';
import * as DashboardDataActions from './../dashboard-data/dashboard-data.actions';
import {getPerspectiveSavedPerspectives} from './view.utils';
import {TeamService} from '../../data-service/team/team.service';
import {Team} from '../teams/team';
import {convertTeamModelToDto} from '../teams/teams.converter';
import {selectViewsPermissions} from '../user-permissions/user-permissions.state';

@Injectable()
export class ViewsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );

  public getOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.GetOne>(ViewsActionType.GET_BY_CODE),
      mergeMap(action =>
        this.viewService.getView(action.payload.viewId).pipe(
          map((dto: ViewDto) => convertViewDtoToModel(dto)),
          map((view: View) => new ViewsAction.GetSuccess({views: [view]})),
          catchError(error => of(new ViewsAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.GetFailure>(ViewsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@views.get.fail:Could not get views`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );

  public createSuccess$ = createEffect(() =>
    this.actions$.pipe(
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
        if (this.configurationService.getConfiguration().analytics) {
          this.angulartics2.eventTrack.next({
            action: 'View create',
            properties: {category: 'Application Resources', label: 'count', value: Object.keys(views).length + 1},
          });

          if (this.configurationService.getConfiguration().mixpanelKey) {
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
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.CreateFailure>(ViewsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@view.create.fail:Could not create the view`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );

  public updateSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.UpdateSuccess>(ViewsActionType.UPDATE_SUCCESS),
      withLatestFrom(this.store$.pipe(select(selectNavigation)), this.store$.pipe(select(selectViewsPermissions))),
      mergeMap(([action, navigation, viewsPermissions]) => {
        const viewCodeInUrl = navigation && navigation.workspace && navigation.workspace.viewCode;
        const {id, code, query, settings} = action.payload.view;
        const cleanedView = cleanQueryFromHiddenAttributes(query, settings?.attributes, viewsPermissions?.[id]);
        if (viewCodeInUrl && viewCodeInUrl === code && !areQueriesEqual(cleanedView, navigation.query)) {
          return [new NavigationAction.SetQuery({query: cleanedView})];
        }
        return [];
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.UpdateFailure>(ViewsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@view.update.fail:Could not update the view`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public resetViewConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.ResetViewConfig>(ViewsActionType.RESET_VIEW_CONFIG),
      withLatestFrom(this.store$.pipe(select(selectViewsDictionary))),
      filter(([action, viewsMap]) => !!viewsMap[action.payload.viewId]),
      mergeMap(([action, viewsMap]) => {
        const view = viewsMap[action.payload.viewId];

        return getPerspectiveSavedPerspectives(view.perspective).reduce((actions, savedPerspective) => {
          actions.push(...this.resetPerspectiveConfigActions(view, savedPerspective));
          return actions;
        }, []);
      })
    )
  );

  private resetPerspectiveConfigActions(view: View, perspective: Perspective): Action[] {
    switch (perspective) {
      case Perspective.Search:
        const searchConfig = view.config?.search;
        return [new SearchesAction.SetConfig({searchId: view.code, config: searchConfig})];
      case Perspective.Table:
        const tableConfig = view.config?.table;
        return [new TablesAction.SetConfig({tableId: view.code, config: tableConfig})];
      case Perspective.Pivot:
        const pivotConfig = view.config?.pivot;
        return [new PivotsAction.SetConfig({pivotId: view.code, config: pivotConfig})];
      case Perspective.GanttChart:
        const ganttConfig = view.config?.ganttChart;
        return [new GanttChartAction.SetConfig({ganttChartId: view.code, config: ganttConfig})];
      case Perspective.Map:
        const mapConfig = view.config?.map;
        return [new MapsAction.SetConfig({mapId: view.code, config: mapConfig})];
      case Perspective.Calendar:
        const calendarConfig = view.config?.calendar;
        return [new CalendarsAction.SetConfig({calendarId: view.code, config: calendarConfig})];
      case Perspective.Kanban:
        const kanbanConfig = view.config?.kanban;
        return [new KanbansAction.SetConfig({kanbanId: view.code, config: kanbanConfig})];
      case Perspective.Chart:
        const chartConfig = view.config?.chart;
        return [new ChartAction.SetConfig({chartId: view.code, config: chartConfig})];
      case Perspective.Workflow:
        const workflowConfig = view.config?.workflow;
        return [new WorkflowsAction.SetConfig({workflowId: view.code, config: workflowConfig})];
      case Perspective.Detail:
        const detailConfig = view.config?.detail;
        return [DetailActions.setConfig({detailId: view.code, config: detailConfig})];
      default:
        return [];
    }
  }

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.Delete>(ViewsActionType.DELETE),
      withLatestFrom(this.store$.pipe(select(selectViewsDictionary))),
      filter(([action, viewsMap]) => !!viewsMap[action.payload.viewId]),
      mergeMap(([action, viewsMap]) => {
        const view = viewsMap[action.payload.viewId];
        return this.viewService.deleteView(action.payload.viewId).pipe(
          mergeMap(() => [
            new ViewsAction.DeleteSuccess({
              viewId: action.payload.viewId,
              viewCode: view.code,
            }),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
          catchError(error =>
            of(new ViewsAction.DeleteFailure({error}), ...createCallbackActions(action.payload.onFailure))
          )
        );
      })
    )
  );

  public deleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.DeleteSuccess>(ViewsActionType.DELETE_SUCCESS),
      withLatestFrom(this.store$.pipe(select(selectNavigation))),
      mergeMap(([action, navigation]) => {
        const viewCodeInUrl = navigation && navigation.workspace && navigation.workspace.viewCode;
        if (viewCodeInUrl && viewCodeInUrl === action.payload.viewCode) {
          return [new RemoveViewFromUrl({})];
        }
        return [];
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.DeleteFailure>(ViewsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@view.delete.fail:Could not delete the view`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public setUserPermission$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.SetPermissions>(ViewsActionType.SET_PERMISSIONS),
      concatMap(action => {
        const {permissions, viewId, newUsers, newUsersRoles, newTeams} = action.payload;

        return combineLatest([
          this.addUsersToWorkspace(newUsers, newUsersRoles),
          this.addTeamsToWorkspace(newTeams),
        ]).pipe(
          mergeMap(([newUserPermissions]) => {
            const userPermissionsDto: PermissionDto[] = [...permissions.users, ...newUserPermissions].map(
              convertPermissionModelToDto
            );
            const teamPermissionsDto: PermissionDto[] = permissions.groups.map(convertPermissionModelToDto);
            const permissionsDto = {users: userPermissionsDto, groups: teamPermissionsDto};
            return this.viewService.updatePermissions(viewId, permissionsDto);
          }),
          map(dto => convertPermissionsDtoToModel(dto)),
          concatMap(newPermissions =>
            of(
              new ViewsAction.SetPermissionsSuccess({viewId, permissions: newPermissions}),
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
            return of(
              new ViewsAction.SetPermissionsFailure({error}),
              ...createCallbackActions(action.payload.onFailure)
            );
          })
        );
      })
    )
  );

  private addUsersToWorkspace(newUsers: User[], newUsersRoles: Record<string, Role[]>): Observable<Permission[]> {
    if (newUsers.length === 0) {
      return of([]);
    }

    const usersDtos = newUsers.map(user => convertUserModelToDto(user));
    return this.store$.select(pipe(selectWorkspaceWithIds)).pipe(
      take(1),
      mergeMap(workspace =>
        this.userService.createUsersInWorkspace(workspace.organizationId, workspace.projectId, usersDtos)
      ),
      map(users =>
        users
          .map((user, index) => {
            if (!newUsers[index].id) {
              // we collect roles only from newly created users
              const correlationId = newUsers[index].correlationId;
              const roles = newUsersRoles[correlationId];
              return {id: user.id, roles};
            }
            return null;
          })
          .filter(permission => !!permission)
      )
    );
  }

  private addTeamsToWorkspace(teams: Team[]): Observable<any> {
    if (teams.length === 0) {
      return of(true);
    }

    const teamsDtos = teams.map(team => convertTeamModelToDto(team));
    return this.store$.select(pipe(selectWorkspaceWithIds)).pipe(
      take(1),
      mergeMap(workspace =>
        this.teamService.addTeamsToWorkspace(workspace.organizationId, workspace.projectId, teamsDtos)
      )
    );
  }

  public setPermissionFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.SetPermissionsFailure>(ViewsActionType.SET_PERMISSIONS_FAILURE),
      tap(action => console.error(action.payload.error)),
      withLatestFrom(this.store$.pipe(select(selectOrganizationByWorkspace))),
      map(([action, organization]) => {
        if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
          return new UsersAction.InvitationExceeded({organizationId: organization.id});
        }
        const message = $localize`:@@view.change.permission.fail:Could not change the view permissions`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public setViewFolders$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.SetViewFolders>(ViewsActionType.SET_VIEW_FOLDERS),
      withLatestFrom(this.store$.pipe(select(selectViewsDictionary))),
      mergeMap(([action, viewsMap]) => {
        const view = viewsMap[action.payload.viewId];
        const previousFolders = view.folders;
        const dto = convertViewModelToDto({...view, folders: action.payload.folders});

        return this.viewService.updateView(action.payload.viewId, dto).pipe(
          mergeMap(() => EMPTY),
          catchError(error =>
            of(
              new ViewsAction.SetViewFoldersFailure({
                viewId: action.payload.viewId,
                previousFolders,
                error,
              })
            )
          )
        );
      })
    )
  );

  public setViewFoldersFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.SetViewFoldersFailure>(ViewsActionType.SET_VIEW_FOLDERS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@view.set.folders.fail:Could not update view folders`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public addFavorite$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.AddFavorite>(ViewsActionType.ADD_FAVORITE),
      mergeMap(action =>
        this.viewService.addFavorite(action.payload.viewId, action.payload.workspace).pipe(
          mergeMap(() => EMPTY),
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
    )
  );

  public addFavoriteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.AddFavoriteFailure>(ViewsActionType.ADD_FAVORITE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@view.add.favorite.fail:Could not add the view to favorites`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public removeFavorite$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.RemoveFavorite>(ViewsActionType.REMOVE_FAVORITE),
      mergeMap(action =>
        this.viewService.removeFavorite(action.payload.viewId, action.payload.workspace).pipe(
          mergeMap(() => EMPTY),
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
    )
  );

  public removeFavoriteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.RemoveFavoriteFailure>(ViewsActionType.REMOVE_FAVORITE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@view.remove.favorite.fail:Could not remove the view from favorites`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public setDefaultConfig$ = createEffect(
    () =>
      this.actions$.pipe(
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
      ),
    {dispatch: false}
  );

  public getDefaultConfigs$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.GetDefaultConfigs>(ViewsActionType.GET_DEFAULT_CONFIGS),
      mergeMap(action => {
        return this.viewService.getDefaultConfigs(action.payload.workspace).pipe(
          map(dtos => dtos.map(dto => convertDefaultViewConfigDtoToModel(dto))),
          map(configs => new ViewsAction.GetDefaultConfigsSuccess({configs})),
          catchError(() => of(new ViewsAction.GetDefaultConfigsSuccess({configs: []})))
        );
      })
    )
  );

  public resetDefaultConfigBySnapshot$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );

  public setDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.SetDashboard>(ViewsActionType.SET_DASHBOARD),
      withLatestFrom(this.store$.pipe(select(selectDefaultViewConfig(Perspective.Search, DEFAULT_PERSPECTIVE_ID)))),
      mergeMap(([action, defaultView]) => {
        const config = defaultView?.config || {};
        const searchConfig = {...config.search, dashboard: action.payload.dashboard};
        const defaultViewConfig: DefaultViewConfig = {
          key: DEFAULT_PERSPECTIVE_ID,
          perspective: Perspective.Search,
          config: {search: searchConfig},
        };
        const oldDashboard = defaultView?.config?.search?.dashboard;

        return this.viewService
          .updateDefaultConfig(
            convertDefaultViewConfigModelToDto({
              ...defaultViewConfig,
              updatedAt: new Date(),
            })
          )
          .pipe(
            map(dto => convertDefaultViewConfigDtoToModel(dto)),
            mergeMap(model =>
              of(
                DashboardDataActions.checkDeletedData({
                  oldDashboard,
                  currentDashboard: model.config?.search?.dashboard,
                }),
                new ViewsAction.SetDashboardSuccess({model}),
                ...createCallbackActions(action.payload.onSuccess)
              )
            ),
            catchError(error =>
              of(new ViewsAction.SetDashboardFailure({error}), ...createCallbackActions(action.payload.onFailure))
            )
          );
      })
    )
  );

  public setDashboardFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ViewsAction.SetDashboardFailure>(ViewsActionType.SET_DASHBOARD_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@view.dashboard.set.fail:Could not save dashboard settings`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private actions$: Actions,
    private router: Router,
    private store$: Store<AppState>,
    private viewService: ViewService,
    private userService: UserService,
    private teamService: TeamService,
    private angulartics2: Angulartics2,
    private configurationService: ConfigurationService
  ) {}
}
