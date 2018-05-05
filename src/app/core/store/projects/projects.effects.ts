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
import {catchError, concatMap, filter, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {ProjectService} from '../../rest';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationsDictionary, selectSelectedOrganization} from '../organizations/organizations.state';
import {ProjectConverter} from './project.converter';
import {ProjectsAction, ProjectsActionType} from './projects.action';
import {selectProjectsCodes, selectProjectsLoaded} from './projects.state';
import {isNullOrUndefined} from "util";
import {Permission} from '../../dto';
import {PermissionType} from '../permissions/permissions.model';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {HttpErrorResponse} from "@angular/common/http";
import {RouterAction} from "../router/router.action";
import {RouteFinder} from '../../../shared/utils/route-finder';
import {Router} from "@angular/router";

@Injectable()
export class ProjectsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.Get>(ProjectsActionType.GET),
    withLatestFrom(this.store$.select(selectProjectsLoaded)),
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    filter(([[action, projectsLoaded], organizationsEntities]) => {
      const organizationId = action.payload.organizationId;
      return !projectsLoaded[organizationId] && !isNullOrUndefined(organizationsEntities[organizationId]);
    }),
    map(([[action, projectsLoaded], organizationsEntities]) => ({action, organizationsEntities})),
    mergeMap(({action, organizationsEntities}) => {
      const organizationId = action.payload.organizationId;
      const organization = organizationsEntities[organizationId];
      return this.projectService.getProjects(organization.code).pipe(
        map(dtos => ({organizationId, projects: dtos.map(dto => ProjectConverter.fromDto(dto, organizationId))})),
        map(payload => new ProjectsAction.GetSuccess(payload)),
        catchError(error => Observable.of(new ProjectsAction.GetFailure({error})))
      );
    })
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.GetFailure>(ProjectsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'projects.get.fail', value: 'Failed to get projects'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public getCodes$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.GetCodes>(ProjectsActionType.GET_CODES),
    withLatestFrom(this.store$.select(selectProjectsCodes)),
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    filter(([[action, projectCodes], organizationsEntities]) => {
      const organizationId = action.payload.organizationId;
      return isNullOrUndefined(projectCodes[organizationId]) && !isNullOrUndefined(organizationsEntities[organizationId]);
    }),
    map(([[action], organizationsEntities]) => ({action, organizationsEntities})),
    mergeMap(({action, organizationsEntities}) => {
      const organization = organizationsEntities[action.payload.organizationId];
      return this.projectService.getProjectCodes(organization.code).pipe(
        map(projectCodes => ({projectCodes, organizationId: action.payload.organizationId})),
        map(({projectCodes, organizationId}) => new ProjectsAction.GetCodesSuccess({organizationId, projectCodes})),
        catchError((error) => Observable.of(new ProjectsAction.GetCodesFailure({error: error})))
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
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    mergeMap(([action, organizationsEntities]) => {
      const organization = organizationsEntities[action.payload.project.organizationId];
      const correlationId = action.payload.project.correlationId;
      const projectDto = ProjectConverter.toDto(action.payload.project);

      return this.projectService.createProject(organization.code, projectDto).pipe(
        map(dto => ProjectConverter.fromDto(dto, action.payload.project.organizationId, correlationId)),
        withLatestFrom(this.store$.select(selectProjectsCodes)),
        flatMap(([project, projectCodes]) => {
          const codes = [...projectCodes[project.organizationId], project.code];
          return [new ProjectsAction.CreateSuccess({project}),
            new ProjectsAction.GetCodesSuccess({organizationId: project.organizationId, projectCodes: codes})];
        }),
        catchError(error => Observable.of(new ProjectsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.CreateFailure>(ProjectsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.select(selectSelectedOrganization)),
    map(([action, organization]) => {
      if (action.payload.error instanceof HttpErrorResponse && action.payload.error.status == 402) {
        const title = this.i18n({ id: 'serviceLimits.trial', value: 'Free Service' });
        const message = this.i18n({
          id: 'project.create.serviceLimits',
          value: 'You are currently on the Free plan which allows you to have only one project. Do you want to upgrade to Business now?' });
        return new NotificationsAction.Confirm({
          title,
          message,
          action: new RouterAction.Go({
            path: ['/organization', organization.code, 'detail'],
            extras: { fragment: 'orderService' }
          })
        });
      }
      const message = this.i18n({id: 'project.create.fail', value: 'Failed to create project'});
      return new NotificationsAction.Error({message});
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
        map(dto => ({project: ProjectConverter.fromDto(dto, action.payload.project.organizationId), oldProject})),
        withLatestFrom(this.store$.select(selectProjectsCodes)),
        flatMap(([{project, oldProject}, projectCodes]) => {
          const actions: Action[] = [new ProjectsAction.UpdateSuccess({project: {...project, id: project.id}})];
          const codesByOrg = projectCodes && projectCodes[project.organizationId];
          if (codesByOrg) {
            const codes = codesByOrg.map(code => code === oldProject.code ? project.code : code);
            actions.push(new ProjectsAction.GetCodesSuccess({organizationId: project.organizationId, projectCodes: codes}));
          }

          const paramMap = RouteFinder.getFirstChildRouteWithParams(this.router.routerState.root.snapshot).paramMap;
          const projCodeInRoute = paramMap.get('projectCode');

          if (projCodeInRoute && projCodeInRoute === oldProject.code && project.code !== oldProject.code) {
            const paths = this.router.routerState.snapshot.url.split('/').filter(path => path);
            const index = paths.indexOf(oldProject.code, 3);
            if (index !== -1) {
              paths[index] = project.code;
              actions.push(new RouterAction.Go({path: paths}));
            }
          }

          return actions;
        }),
        catchError(error => Observable.of(new ProjectsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.UpdateFailure>(ProjectsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.update.fail', value: 'Failed to update project'});
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
        map(() => ({action, deletedProjectCode: project.code})),
        withLatestFrom(this.store$.select(selectProjectsCodes)),
        flatMap(([{action, deletedProjectCode}, projectCodes]) => {
          const codes = projectCodes[action.payload.organizationId].filter(code => code !== deletedProjectCode);
          return [new ProjectsAction.DeleteSuccess(action.payload),
            new ProjectsAction.GetCodesSuccess({organizationId: action.payload.organizationId, projectCodes: codes})];
        }),
        catchError(error => Observable.of(new ProjectsAction.DeleteFailure({error: error})))
      );
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.DeleteFailure>(ProjectsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.delete.fail', value: 'Failed to delete project'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public changePermission$ = this.actions$.pipe(
    ofType<ProjectsAction.ChangePermission>(ProjectsActionType.CHANGE_PERMISSION),
    concatMap(action => {
      const permissionDto: Permission = PermissionsConverter.toPermissionDto(action.payload.permission);

      let observable;
      if (action.payload.type === PermissionType.Users) {
        observable = this.projectService.updateUserPermission(permissionDto);
      } else {
        observable = this.projectService.updateGroupPermission(permissionDto);
      }

      return observable.pipe(
        concatMap(() => Observable.of()),
        catchError((error) => {
          const payload = {projectId: action.payload.projectId, type: action.payload.type, permission: action.payload.currentPermission, error};
          return Observable.of(new ProjectsAction.ChangePermissionFailure(payload))
        })
      )
    }),
  );

  @Effect()
  public changePermissionFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ProjectsAction.ChangePermissionFailure>(ProjectsActionType.CHANGE_PERMISSION_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.permission.change.fail', value: 'Failed to change project permission'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private i18n: I18n,
              private router: Router,
              private projectService: ProjectService,
              private store$: Store<AppState>) {
  }

}
