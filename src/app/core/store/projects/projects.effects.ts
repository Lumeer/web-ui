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

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, of} from 'rxjs';
import {catchError, concatMap, filter, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {RouteFinder} from '../../../shared/utils/route-finder';
import {PermissionDto} from '../../dto';
import {ProjectService} from '../../rest';
import {AppState} from '../app.state';
import {CollectionsAction} from '../collections/collections.action';
import {CommonAction} from '../common/common.action';
import {DocumentsAction} from '../documents/documents.action';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {LinkTypesAction} from '../link-types/link-types.action';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationsDictionary} from '../organizations/organizations.state';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {PermissionType} from '../permissions/permissions';
import {RouterAction} from '../router/router.action';
import {UsersAction} from '../users/users.action';
import {selectCurrentUser} from '../users/users.state';
import {ViewsAction} from '../views/views.action';
import {ProjectConverter} from './project.converter';
import {ProjectsAction, ProjectsActionType} from './projects.action';
import {selectProjectsCodes, selectProjectsDictionary, selectProjectsLoaded} from './projects.state';
import {isNullOrUndefined} from '../../../shared/utils/common.utils';
import {selectNavigation} from '../navigation/navigation.state';
import {NotificationService} from '../../notifications/notification.service';

@Injectable()
export class ProjectsEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.Get>(ProjectsActionType.GET),
    withLatestFrom(this.store$.pipe(select(selectProjectsLoaded))),
    withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
    filter(([[action, projectsLoaded], organizationsEntities]) => {
      const {force, organizationId} = action.payload;
      return force || (!projectsLoaded[organizationId] && !!organizationsEntities[organizationId]);
    }),
    map(([[action, projectsLoaded], organizationsEntities]) => ({action, organizationsEntities})),
    tap(({action}) =>
      this.store$.dispatch(new ProjectsAction.GetCodes({organizationId: action.payload.organizationId}))
    ),
    mergeMap(({action, organizationsEntities}) => {
      const organizationId = action.payload.organizationId;
      const organization = organizationsEntities[organizationId];
      return this.projectService.getProjects(organization.code).pipe(
        map(dtos => ({organizationId, projects: dtos.map(dto => ProjectConverter.fromDto(dto, organizationId))})),
        map(payload => new ProjectsAction.GetSuccess(payload)),
        catchError(error => of(new ProjectsAction.GetFailure({error})))
      );
    })
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.GetFailure>(ProjectsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'projects.get.fail', value: 'Could not get projects'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public getCodes$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.GetCodes>(ProjectsActionType.GET_CODES),
    withLatestFrom(this.store$.pipe(select(selectProjectsCodes))),
    withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
    filter(([[action, projectCodes], organizationsEntities]) => {
      const organizationId = action.payload.organizationId;
      return isNullOrUndefined(projectCodes[organizationId]) && !!organizationsEntities[organizationId];
    }),
    map(([[action], organizationsEntities]) => ({action, organizationsEntities})),
    mergeMap(({action, organizationsEntities}) => {
      const organization = organizationsEntities[action.payload.organizationId];
      return this.projectService.getProjectCodes(organization.code).pipe(
        map(projectCodes => ({projectCodes, organizationId: action.payload.organizationId})),
        map(({projectCodes, organizationId}) => new ProjectsAction.GetCodesSuccess({organizationId, projectCodes})),
        catchError(error => of(new ProjectsAction.GetCodesFailure({error: error})))
      );
    })
  );

  @Effect({dispatch: false})
  public getCodesFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.GetCodesFailure>(ProjectsActionType.GET_CODES_FAILURE),
    tap((action: ProjectsAction.GetCodesFailure) => console.error(action.payload.error))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.Create>(ProjectsActionType.CREATE),
    withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
    mergeMap(([action, organizationsEntities]) => {
      const organization = organizationsEntities[action.payload.project.organizationId];
      const correlationId = action.payload.project.correlationId;
      const projectDto = ProjectConverter.toDto(action.payload.project);

      return this.projectService.createProject(organization.code, projectDto).pipe(
        map(dto => ProjectConverter.fromDto(dto, action.payload.project.organizationId, correlationId)),
        mergeMap(project => {
          const actions: Action[] = [new ProjectsAction.CreateSuccess({project})];

          const {callback} = action.payload;
          if (callback) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => callback(project)}));
          }

          return actions;
        }),
        catchError(error => of(new ProjectsAction.CreateFailure({error, organizationCode: organization.code})))
      );
    })
  );

  @Effect()
  public createSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.CreateSuccess>(ProjectsActionType.CREATE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectProjectsCodes))),
    map(([action, codes]) => {
      const project = action.payload.project;
      const codesByOrg = (codes && codes[project.organizationId]) || [];
      const newCodes = [...codesByOrg, project.code];
      return new ProjectsAction.GetCodesSuccess({organizationId: project.organizationId, projectCodes: newCodes});
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.CreateFailure>(ProjectsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(action => {
      if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
        const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
        const message = this.i18n({
          id: 'project.create.serviceLimits',
          value:
            'You are currently on the Free plan which allows you to have only one project. Do you want to upgrade to Business now?',
        });
        return new NotificationsAction.Confirm({
          title,
          message,
          action: new RouterAction.Go({
            path: ['/organization', action.payload.organizationCode, 'detail'],
            extras: {fragment: 'orderService'},
          }),
          yesFirst: true,
        });
      }
      const errorMessage = this.i18n({id: 'project.create.fail', value: 'Could not create the project'});
      return new NotificationsAction.Error({message: errorMessage});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.Update>(ProjectsActionType.UPDATE),
    withLatestFrom(this.store$),
    mergeMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.project.organizationId];
      const oldProject = state.projects.entities[action.payload.project.id];
      const projectDto = ProjectConverter.toDto(action.payload.project);
      return this.projectService.editProject(organization.code, oldProject.code, projectDto).pipe(
        map(dto => ProjectConverter.fromDto(dto, action.payload.project.organizationId)),
        map(
          project => new ProjectsAction.UpdateSuccess({project: {...project, id: project.id}, oldCode: oldProject.code})
        ),
        catchError(error => of(new ProjectsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public updateSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.UpdateSuccess>(ProjectsActionType.UPDATE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectProjectsCodes))),
    flatMap(([action, codes]) => {
      const {project, oldCode} = action.payload;
      const codesByOrg = (codes && codes[project.organizationId]) || [];
      let newCodes = [...codesByOrg];
      if (oldCode) {
        newCodes = newCodes.map(code => (code === oldCode ? project.code : code));
      } else {
        newCodes.push(project.code);
      }

      const actions: Action[] = [
        new ProjectsAction.GetCodesSuccess({organizationId: project.organizationId, projectCodes: newCodes}),
      ];

      const paramMap = RouteFinder.getFirstChildRouteWithParams(this.router.routerState.root.snapshot).paramMap;
      const projCodeInRoute = paramMap.get('projectCode');

      if (projCodeInRoute && oldCode && projCodeInRoute === oldCode && project.code !== oldCode) {
        const paths = this.router.routerState.snapshot.url.split('/').filter(path => path);
        const index = paths.indexOf(oldCode, 2);
        if (index !== -1) {
          paths[index] = project.code;
          actions.push(new RouterAction.Go({path: paths}));
        }
      }

      return actions;
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.UpdateFailure>(ProjectsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.update.fail', value: 'Could not update the project'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.Delete>(ProjectsActionType.DELETE),
    withLatestFrom(this.store$),
    mergeMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.organizationId];
      const project = state.projects.entities[action.payload.projectId];
      return this.projectService.deleteProject(organization.code, project.code).pipe(
        withLatestFrom(this.store$.pipe(select(selectProjectsCodes))),
        flatMap(() => {
          const actions: Action[] = [new ProjectsAction.DeleteSuccess({...action.payload, projectCode: project.code})];

          if (action.payload.onSuccess) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => action.payload.onSuccess()}));
          }
          return actions;
        }),
        catchError(error => of(new ProjectsAction.DeleteFailure({error: error})))
      );
    })
  );

  @Effect()
  public deleteSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.DeleteSuccess>(ProjectsActionType.DELETE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectProjectsCodes))),
    withLatestFrom(this.store$.pipe(select(selectNavigation))),
    flatMap(([[action, codes], navigation]) => {
      const {organizationId, projectCode} = action.payload;
      const codesByOrg = (codes && codes[organizationId]) || [];
      const actions: Action[] = [];
      let newCodes = [...codesByOrg];
      if (projectCode) {
        newCodes = newCodes.filter(code => code !== projectCode);
        actions.push(
          new ProjectsAction.GetCodesSuccess({organizationId: action.payload.organizationId, projectCodes: newCodes})
        );
      }

      if (navigation && navigation.workspace && navigation.workspace.projectCode === projectCode) {
        actions.push(new RouterAction.Go({path: ['/']}));
      }

      return actions;
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.DeleteFailure>(ProjectsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.delete.fail', value: 'Could not delete the project'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public changePermission$ = this.actions$.pipe(
    ofType<ProjectsAction.ChangePermission>(ProjectsActionType.CHANGE_PERMISSION),
    withLatestFrom(this.store$.pipe(select(selectProjectsDictionary))),
    withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
    concatMap(([[action, projects], organizations]) => {
      const project = projects[action.payload.projectId];
      const organization = organizations[project.organizationId];
      const workspace = {organizationCode: organization.code, projectCode: project.code};
      const permissionDto: PermissionDto = PermissionsConverter.toPermissionDto(action.payload.permission);

      let observable;
      if (action.payload.type === PermissionType.Users) {
        observable = this.projectService.updateUserPermission([permissionDto], workspace);
      } else {
        observable = this.projectService.updateGroupPermission([permissionDto], workspace);
      }

      return observable.pipe(
        concatMap(() => of()),
        catchError(error => {
          const payload = {
            projectId: action.payload.projectId,
            type: action.payload.type,
            permission: action.payload.currentPermission,
            error,
          };
          return of(new ProjectsAction.ChangePermissionFailure(payload));
        })
      );
    })
  );

  @Effect()
  public changePermissionFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.ChangePermissionFailure>(ProjectsActionType.CHANGE_PERMISSION_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'project.permission.change.fail',
        value: 'Could not change the project permissions',
      });
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public switchWorkspace$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.SwitchWorkspace>(ProjectsActionType.SWITCH_WORKSPACE),
    withLatestFrom(this.store$.pipe(select(selectCurrentUser))),
    mergeMap(([action, user]) => {
      const {organizationId, projectId, nextAction} = action.payload;
      const workspace = user.defaultWorkspace;
      if (workspace && workspace.organizationId === organizationId && workspace.projectId === projectId) {
        return [];
      }

      const actions: Action[] = [
        new UsersAction.SaveDefaultWorkspace({defaultWorkspace: {organizationId, projectId}}),
        new ProjectsAction.ClearWorkspaceData(),
      ];

      if (nextAction) {
        actions.push(nextAction);
      }

      return actions;
    }),
    tap(() => this.notificationService.clear())
  );

  @Effect()
  public clearWorkspaceData$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.ClearWorkspaceData>(ProjectsActionType.CLEAR_WORKSPACE_DATA),
    mergeMap(() => {
      return [
        new CollectionsAction.Clear(),
        new DocumentsAction.Clear(),
        new LinkInstancesAction.Clear(),
        new LinkTypesAction.Clear(),
        new ViewsAction.Clear(),
      ];
    })
  );

  constructor(
    private actions$: Actions,
    private i18n: I18n,
    private router: Router,
    private notificationService: NotificationService,
    private projectService: ProjectService,
    private store$: Store<AppState>
  ) {}
}
