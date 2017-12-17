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
import {catchError, map, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {ProjectService} from '../../rest';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {ProjectConverter} from './project.converter';
import {ProjectsAction, ProjectsActionType} from './projects.action';

@Injectable()
export class ProjectsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType<ProjectsAction.Get>(ProjectsActionType.GET).pipe(
    withLatestFrom(this.store$),
    switchMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.organizationId];
      return this.projectService.getProjects(organization.code).pipe(
        map(dtos => dtos.map(dto => ProjectConverter.fromDto(dto, action.payload.organizationId)))
      )
    }),
    map(projects => new ProjectsAction.GetSuccess({projects: projects})),
    catchError(error => Observable.of(new ProjectsAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.GetFailure>(ProjectsActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to get projects'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<ProjectsAction.Create>(ProjectsActionType.CREATE).pipe(
    withLatestFrom(this.store$),
    switchMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.project.organizationId];
      const correlationId = action.payload.project.correlationId;
      const projectDto = ProjectConverter.toDto(action.payload.project);

      return this.projectService.createProject(organization.code, projectDto).pipe(
        map(dto => ProjectConverter.fromDto(dto, action.payload.project.organizationId, correlationId))
      );
    }),
    map(project => new ProjectsAction.CreateSuccess({project: project})),
    catchError(error => Observable.of(new ProjectsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.CreateFailure>(ProjectsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to create project'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<ProjectsAction.Update>(ProjectsActionType.UPDATE).pipe(
    withLatestFrom(this.store$),
    switchMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.project.organizationId];
      const project = state.projects.entities[action.payload.project.id];
      const projectDto = ProjectConverter.toDto(action.payload.project);
      return this.projectService.editProject(organization.code, project.code, projectDto).pipe(
        map(dto => ({action, project: ProjectConverter.fromDto(dto, action.payload.project.organizationId)}))
      );
    }),
    map(({action, project}) => new ProjectsAction.UpdateSuccess({
      project: {...project, id: action.payload.project.id}
    })),
    catchError(error => Observable.of(new ProjectsAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.UpdateFailure>(ProjectsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update project'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<ProjectsAction.Delete>(ProjectsActionType.DELETE).pipe(
    withLatestFrom(this.store$),
    switchMap(([action, state]) => {
      const organization = state.organizations.entities[action.payload.organizationId];
      const project = state.projects.entities[action.payload.projectId];
      return this.projectService.deleteProject(organization.code, project.code).pipe(
        map(() => action)
      );
    }),
    map(action => new ProjectsAction.DeleteSuccess(action.payload)),
    catchError(error => Observable.of(new ProjectsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<ProjectsAction.DeleteFailure>(ProjectsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to delete project'}))
  );

  constructor(private actions$: Actions,
              private projectService: ProjectService,
              private store$: Store<AppState>) {
  }

}
