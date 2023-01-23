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

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {EMPTY, Observable, of} from 'rxjs';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {RouteFinder} from '../../../shared/utils/route-finder';
import {PermissionDto} from '../../dto';
import {AppState} from '../app.state';
import {CollectionsAction} from '../collections/collections.action';
import {CommonAction} from '../common/common.action';
import {DocumentsAction} from '../documents/documents.action';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {LinkTypesAction} from '../link-types/link-types.action';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationsDictionary} from '../organizations/organizations.state';
import {convertPermissionModelToDto} from '../permissions/permissions.converter';
import {Permission, PermissionType} from '../permissions/permissions';
import {RouterAction} from '../router/router.action';
import {UsersAction} from '../users/users.action';
import {selectCurrentUser} from '../users/users.state';
import {ViewsAction} from '../views/views.action';
import {ProjectConverter} from './project.converter';
import {ProjectsAction, ProjectsActionType} from './projects.action';
import {selectProjectsDictionary, selectProjectsLoaded} from './projects.state';
import {selectNavigation} from '../navigation/navigation.state';
import {NotificationService} from '../../notifications/notification.service';
import ApplyTemplate = ProjectsAction.ApplyTemplate;
import {createCallbackActions} from '../utils/store.utils';
import {KanbansAction} from '../kanbans/kanbans.action';
import {MapsAction} from '../maps/maps.action';
import {PivotsAction} from '../pivots/pivots.action';
import {CalendarsAction} from '../calendars/calendars.action';
import {GanttChartAction} from '../gantt-charts/gantt-charts.action';
import {SearchesAction} from '../searches/searches.action';
import {ChartAction} from '../charts/charts.action';
import {TemplateService} from '../../rest/template.service';
import {ProjectService} from '../../data-service';
import {OrganizationsAction} from '../organizations/organizations.action';
import {WorkflowsAction} from '../workflows/workflows.action';
import {DataResourcesAction} from '../data-resources/data-resources.action';
import {selectWorkspaceWithIds} from '../common/common.selectors';
import * as DetailActions from './../details/detail.actions';
import * as FormActions from './../form/form.actions';
import * as DashboardDataActions from './../dashboard-data/dashboard-data.actions';
import * as AuditLogsActions from './../audit-logs/audit-logs.actions';
import {ViewSettingsAction} from '../view-settings/view-settings.action';
import {SelectionListsAction} from '../selection-lists/selection-lists.action';
import * as ResourceVariableActions from '../resource-variables/resource-variables.actions';
import {
  getCurrentDataResourcesQueries,
  getCurrentDocumentsQueries,
  getCurrentLinkInstancesQueries,
  getCurrentTasksQueries,
} from '../../service/load-data.service';
import {UserNotificationsAction} from '../user-notifications/user-notifications.action';

@Injectable()
export class ProjectsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.Get>(ProjectsActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectProjectsLoaded))),
      filter(([action, projectsLoaded]) => action.payload.force || !projectsLoaded[action.payload.organizationId]),
      mergeMap(([action]) => {
        const organizationId = action.payload.organizationId;
        return this.projectService.getProjects(action.payload.organizationId).pipe(
          map(dtos => ({organizationId, projects: dtos.map(dto => ProjectConverter.fromDto(dto, organizationId))})),
          map(payload => new ProjectsAction.GetSuccess(payload)),
          catchError(error => of(new ProjectsAction.GetFailure({error})))
        );
      })
    )
  );

  public getOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.GetOne>(ProjectsActionType.GET_ONE),
      mergeMap(action => {
        const {organizationId, projectId} = action.payload;
        return this.projectService.getProject(organizationId, projectId).pipe(
          map(dto => ProjectConverter.fromDto(dto, organizationId)),
          map(project => new ProjectsAction.GetOneSuccess({project})),
          catchError(error => of(new ProjectsAction.GetFailure({error})))
        );
      })
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.GetFailure>(ProjectsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@projects.get.fail:Could not get projects`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.Create>(ProjectsActionType.CREATE),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
      mergeMap(([action, organizationsEntities]) => {
        const {project, templateId, copyProject, navigationExtras, onSuccess, onFailure} = action.payload;
        const organization = organizationsEntities[project.organizationId];
        const projectDto = ProjectConverter.toDto(project);

        return this.projectService.createProject(project.organizationId, projectDto).pipe(
          map(dto => ProjectConverter.fromDto(dto, project.organizationId, project.correlationId)),
          mergeMap(newProject => {
            const actions: Action[] = [
              new ProjectsAction.CreateSuccess({project: newProject}),
              ...createCallbackActions(onSuccess, newProject),
            ];

            const nextActions: Action[] = [];

            if (templateId) {
              nextActions.push(
                new ApplyTemplate({
                  organizationId: project.organizationId,
                  projectId: newProject.id,
                  templateId,
                })
              );
            }

            if (copyProject) {
              nextActions.push(
                new ProjectsAction.Copy({
                  organizationId: project.organizationId,
                  projectId: newProject.id,
                  copyProject,
                })
              );
            }

            actions.push(
              new RouterAction.Go({
                path: ['w', organization.code, newProject.code, 'view', 'search'],
                extras: navigationExtras,
                nextActions,
              })
            );

            return actions;
          }),
          catchError(error => {
            const actions: Action[] = [new ProjectsAction.CreateFailure({error, organizationCode: organization.code})];
            if (onFailure) {
              actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure()}));
            }
            return of(...actions);
          })
        );
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.CreateFailure>(ProjectsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(action => {
        if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
          return new OrganizationsAction.OfferPayment(action.payload);
        }
        const errorMessage = $localize`:@@project.create.fail:Could not create the project`;
        return new NotificationsAction.Error({message: errorMessage});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.Update>(ProjectsActionType.UPDATE),
      withLatestFrom(this.store$.pipe(select(selectProjectsDictionary))),
      mergeMap(([action, projectsMap]) => {
        const {workspace, project} = action.payload;
        const oldProject = projectsMap[project.id];
        const projectDto = ProjectConverter.toDto(project);
        return this.projectService
          .updateProject(workspace?.organizationId || project.organizationId, project.id, projectDto)
          .pipe(
            map(dto => ProjectConverter.fromDto(dto, action.payload.project.organizationId)),
            map(newProject => new ProjectsAction.UpdateSuccess({project: newProject, oldCode: oldProject.code})),
            catchError(error => of(new ProjectsAction.UpdateFailure({error})))
          );
      })
    )
  );

  public updateSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.UpdateSuccess>(ProjectsActionType.UPDATE_SUCCESS),
      mergeMap(action => {
        const {project, oldCode} = action.payload;
        const paramMap = RouteFinder.getFirstChildRouteWithParams(this.router.routerState.root.snapshot).paramMap;
        const projCodeInRoute = paramMap.get('projectCode');

        if (projCodeInRoute && oldCode && projCodeInRoute === oldCode && project.code !== oldCode) {
          const paths = this.router.routerState.snapshot.url.split('/').filter(path => path);
          const index = paths.indexOf(oldCode, 2);
          if (index !== -1) {
            paths[index] = project.code;
            return [new RouterAction.Go({path: paths})];
          }
        }

        return [];
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.UpdateFailure>(ProjectsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@project.update.fail:Could not update the project`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.Delete>(ProjectsActionType.DELETE),
      withLatestFrom(this.store$.pipe(select(selectProjectsDictionary))),
      mergeMap(([action, projectsMap]) => {
        const {organizationId, projectId} = action.payload;
        const project = projectsMap[projectId];
        return this.projectService.deleteProject(organizationId, projectId).pipe(
          map(() => new ProjectsAction.DeleteSuccess({...action.payload, projectCode: project.code})),
          catchError(error => of(new ProjectsAction.DeleteFailure({error})))
        );
      })
    )
  );

  public deleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.DeleteSuccess>(ProjectsActionType.DELETE_SUCCESS),
      withLatestFrom(this.store$.pipe(select(selectNavigation))),
      mergeMap(([action, navigation]) => {
        const {projectCode} = action.payload;
        if (navigation?.workspace?.projectCode === projectCode) {
          return [new RouterAction.Go({path: ['/']})];
        }

        return [];
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.DeleteFailure>(ProjectsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@project.delete.fail:Could not delete the project`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public deleteSampleData$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.DeleteSampleData>(ProjectsActionType.DELETE_SAMPLE_DATA),
      mergeMap(action => {
        const {organizationId, projectId} = action.payload;
        return this.projectService.deleteSampleData(organizationId, projectId, 'PERMANENTLY DELETE').pipe(
          mergeMap(() => EMPTY),
          catchError(error => of(new ProjectsAction.DeleteSampleDataFailure({error})))
        );
      })
    )
  );

  public deleteSampleDataFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.DeleteSampleDataFailure>(ProjectsActionType.DELETE_SAMPLE_DATA_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@project.deleteSampleDate.fail:Could not delete sample data`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public downloadRawContent$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.DownloadRawContent>(ProjectsActionType.DOWNLOAD_RAW_CONTENT),
      mergeMap(action => {
        const {organizationId, projectId} = action.payload;
        return this.projectService.downloadRawContent(organizationId, projectId).pipe(
          mergeMap(data =>
            of(new ProjectsAction.DownloadRawContentSuccess({data, projectName: action.payload.projectName}))
          ),
          catchError(error => of(new ProjectsAction.DownloadRawContentFailure({error})))
        );
      })
    )
  );

  public downloadRawContentSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ProjectsAction.DownloadRawContentSuccess>(ProjectsActionType.DOWNLOAD_RAW_CONTENT_SUCCESS),
        tap(action => {
          //const blob = new Blob([action.payload.data.body], { type: 'application/json' });
          const url = window.URL.createObjectURL(action.payload.data.body);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', action.payload.projectName || 'project.json');
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
      ),
    {dispatch: false}
  );

  public downloadRawContentFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.DownloadRawContentFailure>(ProjectsActionType.DOWNLOAD_RAW_CONTENT_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@project.downloadRawContent.fail:Could not download project data`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public changePermission$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.ChangePermission>(ProjectsActionType.CHANGE_PERMISSION),
      withLatestFrom(this.store$.pipe(select(selectProjectsDictionary))),
      mergeMap(([action, projectsMap]) => {
        this.store$.dispatch(new ProjectsAction.ChangePermissionSuccess(action.payload));

        const originalProject = projectsMap[action.payload.projectId];
        const dtos = action.payload.permissions.map(permission => convertPermissionModelToDto(permission));

        let observable: Observable<PermissionDto>;
        let currentPermissions: Permission[];
        if (action.payload.type === PermissionType.Users) {
          observable = this.projectService.updateUserPermission(dtos);
          currentPermissions = originalProject.permissions?.users;
        } else {
          observable = this.projectService.updateGroupPermission(dtos);
          currentPermissions = originalProject.permissions?.groups;
        }

        return observable.pipe(
          mergeMap(() => EMPTY),
          catchError(error => {
            const payload = {
              ...action.payload,
              permissions: currentPermissions,
              error,
            };
            return of(new ProjectsAction.ChangePermissionFailure(payload));
          })
        );
      })
    )
  );

  public changePermissionFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.ChangePermissionFailure>(ProjectsActionType.CHANGE_PERMISSION_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@project.permission.change.fail:Could not change the project permissions`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public applyTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.ApplyTemplate>(ProjectsActionType.APPLY_TEMPLATE),
      mergeMap(action => {
        const {organizationId, projectId, templateId} = action.payload;
        return this.projectService.applyTemplate(organizationId, projectId, templateId).pipe(
          mergeMap(() => EMPTY),
          catchError(error => of(new ProjectsAction.ApplyTemplateFailure({error})))
        );
      })
    )
  );

  public applyTemplateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.ApplyTemplateFailure>(ProjectsActionType.APPLY_TEMPLATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@project.template.apply.fail:Could not add template to project`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public createSampleData$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.CreateSampleData>(ProjectsActionType.CREATE_SAMPLE_DATA),
      withLatestFrom(this.store$.pipe(select(selectWorkspaceWithIds))),
      mergeMap(([action, workspaceIds]) => {
        const {type, errorMessage, onSuccess, onFailure} = action.payload;
        return this.projectService.createSampleData(workspaceIds?.organizationId, workspaceIds?.projectId, type).pipe(
          mergeMap(() => createCallbackActions(onSuccess)),
          catchError(() =>
            of(new NotificationsAction.Error({message: errorMessage}), ...createCallbackActions(onFailure))
          )
        );
      })
    )
  );

  public copy$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.Copy>(ProjectsActionType.COPY),
      mergeMap(action => {
        const {organizationId, projectId, copyProject} = action.payload;
        return this.projectService
          .copyProject(organizationId, projectId, copyProject.organizationId, copyProject.id)
          .pipe(
            mergeMap(() => EMPTY),
            catchError(error => of(new ProjectsAction.CopyFailure({error})))
          );
      })
    )
  );

  public copyFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.CopyFailure>(ProjectsActionType.COPY_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@project.copy.fail:Could not copy project`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public switchWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.SwitchWorkspace>(ProjectsActionType.SWITCH_WORKSPACE),
      withLatestFrom(this.store$.pipe(select(selectCurrentUser)), this.store$.pipe(select(selectWorkspaceWithIds))),
      mergeMap(([action, user, currentWorkspace]) => {
        const {organizationId, projectId, nextAction} = action.payload;
        const userWorkspace = user.defaultWorkspace;
        const actions: Action[] = [];

        if (
          !userWorkspace ||
          userWorkspace.organizationId !== organizationId ||
          userWorkspace.projectId !== projectId
        ) {
          actions.push(new UsersAction.SaveDefaultWorkspace({defaultWorkspace: {organizationId, projectId}}));
        }

        const nextActionUsed = false;
        if (
          (currentWorkspace?.organizationId && currentWorkspace.organizationId !== organizationId) ||
          (currentWorkspace?.projectId && currentWorkspace.projectId !== projectId)
        ) {
          actions.push(new ProjectsAction.ClearWorkspaceData({nextAction}));
        }

        if (!!nextAction && !nextActionUsed) {
          actions.push(nextAction);
        }

        return actions;
      }),
      tap(() => this.notificationService.clear())
    )
  );

  public clearWorkspaceData$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.ClearWorkspaceData>(ProjectsActionType.CLEAR_WORKSPACE_DATA),
      mergeMap(action => {
        const {nextAction} = action.payload;
        const actions: Action[] = [
          new CollectionsAction.Clear(),
          new DocumentsAction.Clear(),
          new DataResourcesAction.Clear(),
          new LinkInstancesAction.Clear(),
          new LinkTypesAction.Clear(),
          new ViewsAction.Clear(),
          new ViewSettingsAction.Clear(),
          new KanbansAction.Clear(),
          DetailActions.clear(),
          new MapsAction.Clear(),
          new PivotsAction.Clear(),
          new CalendarsAction.Clear(),
          new GanttChartAction.Clear(),
          new SearchesAction.Clear(),
          new ChartAction.Clear(),
          new WorkflowsAction.Clear(),
          new SearchesAction.Clear(),
          DashboardDataActions.clear(),
          FormActions.clear(),
          AuditLogsActions.clear(),
        ];

        if (nextAction) {
          actions.push(nextAction);
        }

        return actions;
      })
    )
  );

  public refreshWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.RefreshWorkspace>(ProjectsActionType.REFRESH_WORKSPACE),
      withLatestFrom(this.store$.pipe(select(selectWorkspaceWithIds))),
      mergeMap(([, workspace]) => {
        const actions: Action[] = [
          new OrganizationsAction.GetAllWorkspaces({force: true}),
          new CollectionsAction.Get({force: true}),
          new LinkTypesAction.Get({force: true}),
          new ViewsAction.Get({force: true}),
          new UserNotificationsAction.Get({force: true}),
        ];

        const documentsQueries = getCurrentDocumentsQueries();
        const tasksQueries = getCurrentTasksQueries();
        const linkInstancesQueries = getCurrentLinkInstancesQueries();
        const dataResourcesQueries = getCurrentDataResourcesQueries();

        actions.push(
          new DataResourcesAction.RefreshData({
            documentsQueries,
            tasksQueries,
            linkInstancesQueries,
            dataResourcesQueries,
          })
        );

        const {organizationId} = workspace;
        if (organizationId) {
          actions.push(new UsersAction.Get({organizationId, force: true}));
          actions.push(new SelectionListsAction.Get({organizationId, force: true}));
          actions.push(ResourceVariableActions.get({workspace, force: true}));
          actions.push(DashboardDataActions.get({workspace, force: true}));
          actions.push(new ViewsAction.GetDefaultConfigs({workspace}));
        }

        return actions;
      })
    )
  );

  public getTemplates$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ProjectsAction.GetTemplates>(ProjectsActionType.GET_TEMPLATES),
      mergeMap(() => {
        return this.templateService.getTemplates().pipe(
          map(dtos => dtos.map(dto => ProjectConverter.fromDto(dto))),
          map(templates => new ProjectsAction.GetTemplatesSuccess({templates})),
          catchError(error => of(new ProjectsAction.GetTemplatesFailure({error})))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private router: Router,
    private notificationService: NotificationService,
    private projectService: ProjectService,
    private templateService: TemplateService,
    private store$: Store<AppState>
  ) {}
}
