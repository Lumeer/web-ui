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
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {catchError, map, skipWhile, switchMap, tap, withLatestFrom, flatMap} from 'rxjs/operators';
import {ProjectService} from '../../rest';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationsDictionary} from '../organizations/organizations.state';
import {ProjectConverter} from './project.converter';
import {ProjectsAction, ProjectsActionType} from './projects.action';
import {selectProjectsCodes} from "./projects.state";

@Injectable()
export class ProjectsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType<ProjectsAction.Get>(ProjectsActionType.GET).pipe(
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    skipWhile(([action, organizationsEntities]) => !organizationsEntities[action.payload.organizationId]),
    switchMap(([action, organizationsEntities]) => {
      const organization = organizationsEntities[action.payload.organizationId];
      return this.projectService.getProjects(organization.code).pipe(
        map(dtos => dtos.map(dto => ProjectConverter.fromDto(dto, action.payload.organizationId)))
      );
    }),
    map(projects => new ProjectsAction.GetSuccess({projects: projects})),
    catchError(error => Observable.of(new ProjectsAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.GetFailure>(ProjectsActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'projects.get.fail', value: 'Failed to get projects'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public getCodes$: Observable<Action> = this.actions$.ofType<ProjectsAction.GetCodes>(ProjectsActionType.GET_CODES).pipe(
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    switchMap(([action, organizationsEntities]) => {
      const organization = organizationsEntities[action.payload.organizationId];
      return this.projectService.getProjectCodes(organization.code).pipe(
        map(projectCodes => ({projectCodes, organizationId: action.payload.organizationId}))
      )
    }),
    map(({projectCodes, organizationId}) => new ProjectsAction.GetCodesSuccess({organizationId, projectCodes})),
    catchError((error) => Observable.of(new ProjectsAction.GetCodesFailure({error: error})))
  );

  @Effect({dispatch: false})
  public getCodesFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.GetCodesFailure>(ProjectsActionType.GET_CODES_FAILURE).pipe(
    tap((action: ProjectsAction.GetCodesFailure) => console.error(action.payload.error))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<ProjectsAction.Create>(ProjectsActionType.CREATE).pipe(
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    switchMap(([action, organizationsEntities]) => {
      const organization = organizationsEntities[action.payload.project.organizationId];
      const correlationId = action.payload.project.correlationId;
      const projectDto = ProjectConverter.toDto(action.payload.project);

      return this.projectService.createProject(organization.code, projectDto).pipe(
        map(dto => ProjectConverter.fromDto(dto, action.payload.project.organizationId, correlationId))
      );
    }),
    withLatestFrom(this.store$.select(selectProjectsCodes)),
    flatMap(([project, projectCodes]) => {
      const codes = [...projectCodes[project.organizationId], project.code];
      return [new ProjectsAction.CreateSuccess({project}),
        new ProjectsAction.GetCodesSuccess({organizationId: project.organizationId, projectCodes: codes})];
    }),
    catchError(error => Observable.of(new ProjectsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.CreateFailure>(ProjectsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.create.fail', value: 'Failed to create project'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<ProjectsAction.Update>(ProjectsActionType.UPDATE).pipe(
    withLatestFrom(this.store$),
    switchMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.project.organizationId];
      const oldProject = state.projects.entities[action.payload.project.id];
      const projectDto = ProjectConverter.toDto(action.payload.project);
      return this.projectService.editProject(organization.code, oldProject.code, projectDto).pipe(
        map(dto => ({ project: ProjectConverter.fromDto(dto, action.payload.project.organizationId), oldProject}))
      );
    }),
    withLatestFrom(this.store$.select(selectProjectsCodes)),
    flatMap(([{project, oldProject}, projectCodes]) => {
      const codes = projectCodes[project.organizationId].map(code => code === oldProject.code ? project.code : code);
      return [new ProjectsAction.UpdateSuccess({project: {...project, id: project.id}}),
        new ProjectsAction.GetCodesSuccess({organizationId: project.organizationId, projectCodes: codes})
      ];
    }),
    catchError(error => Observable.of(new ProjectsAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.UpdateFailure>(ProjectsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.update.fail', value: 'Failed to update project'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<ProjectsAction.Delete>(ProjectsActionType.DELETE).pipe(
    withLatestFrom(this.store$),
    switchMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.organizationId];
      const project = state.projects.entities[action.payload.projectId];
      return this.projectService.deleteProject(organization.code, project.code).pipe(
        map(() => ({action, deletedProjectCode: project.code}))
      );
    }),
    withLatestFrom(this.store$.select(selectProjectsCodes)),
    flatMap(([{action, deletedProjectCode}, projectCodes]) => {
      const codes = projectCodes[action.payload.organizationId].filter(code => code !== deletedProjectCode);
      return [new ProjectsAction.DeleteSuccess(action.payload),
        new ProjectsAction.GetCodesSuccess({organizationId: action.payload.organizationId, projectCodes: codes})];
    }),
    catchError(error => Observable.of(new ProjectsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.DeleteFailure>(ProjectsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'project.delete.fail', value: 'Failed to delete project'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private i18n: I18n,
              private projectService: ProjectService,
              private store$: Store<AppState>) {
  }

}
