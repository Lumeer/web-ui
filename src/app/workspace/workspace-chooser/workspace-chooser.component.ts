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

import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {Component, OnDestroy, OnInit} from '@angular/core';

import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {filter, first, map, mergeMap, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../core/store/app.state';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {selectAllOrganizations, selectOrganizationById, selectOrganizationCodes, selectSelectedOrganization, selectSelectedOrganizationId} from '../../core/store/organizations/organizations.state';
import {ProjectModel} from '../../core/store/projects/project.model';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {selectProjectById, selectProjectsCodesForSelectedOrganization, selectProjectsForSelectedOrganization, selectSelectedProject, selectSelectedProjectId} from '../../core/store/projects/projects.state';
import {RouterAction} from '../../core/store/router/router.action';
import {ViewsAction} from '../../core/store/views/views.action';
import {UserSettingsService} from '../../core/user-settings.service';
import {Router} from "@angular/router";
import {userHasRoleInResource, userRolesInResource} from '../../shared/utils/resource.utils';
import {UserModel} from '../../core/store/users/user.model';
import {mapGroupsOnUser, selectCurrentUser, selectCurrentUserForOrganization} from '../../core/store/users/users.state';
import {selectGroupsDictionary} from '../../core/store/groups/groups.state';
import {ServiceLimitsAction} from '../../core/store/organizations/service-limits/service-limits.action';
import {selectAllServiceLimits, selectServiceLimitsByOrganizationId} from '../../core/store/organizations/service-limits/service-limits.state';
import {ServiceLimitsModel} from '../../core/store/organizations/service-limits/service-limits.model';
import {Role} from '../../core/model/role';
import {Perspective} from '../../view/perspectives/perspective';
import {ResourceType} from '../../core/model/resource-type';
import {UsersAction} from '../../core/store/users/users.action';

const allowedEmails = ['support@lumeer.io', 'martin@vecerovi.com', 'aturing@lumeer.io'];

@Component({
  selector: 'workspace-chooser',
  templateUrl: './workspace-chooser.component.html',
  styleUrls: ['./workspace-chooser.component.scss'],
  animations: [
    trigger('animateOpacityFromUp', [
      state('in', style({transform: 'translateY(0)', opacity: 1})),
      transition('void => *', [
        animate(300, keyframes([
          style({transform: 'translateY(-50px)', opacity: 0, offset: 0}),
          style({transform: 'translateY(0)', opacity: 1, offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(300, keyframes([
          style({transform: 'translateY(0)', opacity: 1, offset: 0}),
          style({transform: 'translateY(-50px)', opacity: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class WorkspaceChooserComponent implements OnInit, OnDestroy {

  public organizations$: Observable<OrganizationModel[]>;
  public organizationCodes$: Observable<string[]>;
  public organizationsRoles$: Observable<{ [organizationId: string]: string[] }>;
  public canCreateOrganizations$: Observable<boolean>;
  public serviceLimits$: Observable<ServiceLimitsModel[]>;

  public projects$: Observable<ProjectModel[]>;
  public projectCodes$: Observable<string[]>;
  public projectRoles$: Observable<{ [projectId: string]: string[] }>;
  public canCreateProjects$: Observable<boolean>;

  public currentUser: UserModel;
  public selectedOrganizationId: string;
  public selectedProjectId: string;

  private subscriptions = new Subscription();

  constructor(private store: Store<AppState>,
              private router: Router,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    this.bindData();
    this.subscribeData();

    this.store.dispatch(new OrganizationsAction.GetCodes());
    this.store.dispatch(new OrganizationsAction.Get());
    this.store.dispatch(new ServiceLimitsAction.GetAll());
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSelectOrganization(id: string) {
    this.store.dispatch(new OrganizationsAction.Select({organizationId: id}));
    this.store.dispatch(new ProjectsAction.Select({projectId: null}));
  }

  public onCreateOrganization(organization: OrganizationModel) {
    this.store.dispatch(new OrganizationsAction.Create({organization}));
  }

  public onUpdateOrganization(resource: OrganizationModel) {
    this.store.dispatch(new OrganizationsAction.Update({organization: resource}));
  }

  public onDeleteOrganization(id: string) {
    if (this.selectedOrganizationId === id) {
      this.onSelectOrganization(null);
    }
    this.store.dispatch(new OrganizationsAction.Delete({organizationId: id}));
  }

  public onOrganizationSettings(id: string) {
    this.store.select(selectOrganizationById(id)).pipe(first()).subscribe(organization => {
      if (organization) {
        this.store.dispatch(new RouterAction.Go({path: ['organization', organization.code]}));
      }
    });
  }

  public onSelectProject(id: string) {
    this.store.dispatch(new ProjectsAction.Select({projectId: id}));
  }

  public onCreateProject(project: ProjectModel) {
    if (!isNullOrUndefined(this.selectedOrganizationId)) {
      const projectModel = {...project, organizationId: this.selectedOrganizationId};
      this.store.dispatch(new ProjectsAction.Create({project: projectModel}));
    }
  }

  public onUpdateProject(resource: ProjectModel) {
    if (!isNullOrUndefined(this.selectedOrganizationId)) {
      this.store.dispatch(new ProjectsAction.Update({project: resource}));
    }
  }

  public onDeleteProject(id: string) {
    if (!isNullOrUndefined(this.selectedOrganizationId)) {
      if (this.selectedProjectId === id) {
        this.onSelectProject(null);
      }
      this.store.dispatch(new ProjectsAction.Delete({organizationId: this.selectedOrganizationId, projectId: id}));
    }
  }

  public onProjectSettings(id: string) {
    if (!isNullOrUndefined(this.selectedOrganizationId)) {
      Observable.combineLatest(
        this.store.select(selectSelectedOrganization),
        this.store.select(selectProjectById(id))
      ).pipe(first())
        .subscribe(([organization, project]) => {
          if (organization && project) {
            this.store.dispatch(new RouterAction.Go({path: ['organization', organization.code, 'project', project.code]}));
          }
        });
    }
  }

  public onSaveActiveItems() {
    if (!isNullOrUndefined(this.selectedOrganizationId) && !isNullOrUndefined(this.selectedProjectId)) {
      Observable.combineLatest(
        this.store.select(selectSelectedOrganization),
        this.store.select(selectSelectedProject)
      ).pipe(first())
        .subscribe(([organization, project]) => {
          if (organization && project) {
            this.updateDefaultWorkspace(organization, project);
            this.clearStore();
            this.router.navigate(['/w', organization.code, project.code, 'view', Perspective.Search, 'files']);
          }
        });
    }
  }

  public onWarningMessage(message: string) {
    this.store.dispatch(new NotificationsAction.Warning({message}));
  }

  public organizationItemType(): ResourceType {
    return ResourceType.Organization;
  }

  public projectItemType(): ResourceType {
    return ResourceType.Project;
  }

  private clearStore() {
    this.store.dispatch(new CollectionsAction.Clear());
    this.store.dispatch(new DocumentsAction.Clear());
    this.store.dispatch(new LinkInstancesAction.Clear());
    this.store.dispatch(new LinkTypesAction.Clear());
    this.store.dispatch(new ViewsAction.Clear());
  }

  private updateDefaultWorkspace(organization: OrganizationModel, project: ProjectModel) {
    const defaultWorkspace = {organizationId: organization.id, projectId: project.id};
    this.store.dispatch(new UsersAction.SaveDefaultWorkspace({defaultWorkspace}));
  }

  private bindData() {
    this.organizations$ = this.store.select(selectAllOrganizations);
    this.organizationCodes$ = this.store.select(selectOrganizationCodes).pipe(
      map(codes => codes || [])
    );

    this.organizationsRoles$ = this.organizations$.pipe(
      withLatestFrom(this.store.select(selectCurrentUser)),
      withLatestFrom(this.store.select(selectGroupsDictionary)),
      map(([[organizations, user], groups]) => organizations.reduce((map, organization) => {
        const userWithGroups = mapGroupsOnUser(user, organization.id, groups);
        map[organization.id] = userRolesInResource(userWithGroups, organization);
        return map;
      }, {}))
    );
    this.canCreateOrganizations$ = this.store.select(selectCurrentUser).pipe(
      map(user => allowedEmails.includes(user.email))
    );
    this.serviceLimits$ = this.store.select(selectAllServiceLimits);

    this.projects$ = this.store.select(selectProjectsForSelectedOrganization);
    this.projectCodes$ = this.store.select(selectProjectsCodesForSelectedOrganization).pipe(
      map(codes => codes || [])
    );
    this.projectRoles$ = this.projects$.pipe(
      mergeMap(projects => this.selectOrganizationAndCurrentUser().pipe(
        map(({organization, user}) => projects.reduce((map, project) => {
          map[project.id] = userRolesInResource(user, project);
          return map;
        }, {}))
      ))
    );
    this.canCreateProjects$ = this.selectOrganizationAndCurrentUser().pipe(
      map(({organization, user}) => userHasRoleInResource(user, organization, Role.Write))
    );
  }

  private selectOrganizationAndCurrentUser(): Observable<({ organization: OrganizationModel, user: UserModel })> {
    return this.store.select(selectSelectedOrganization).pipe(
      filter(organization => !isNullOrUndefined(organization)),
      mergeMap(organization => this.store.select(selectCurrentUserForOrganization(organization)).pipe(
        map(user => ({organization, user}))
      ))
    );
  }

  private subscribeData() {
    this.subscriptions.add(this.store.select(selectSelectedOrganizationId).subscribe(id => {
      this.selectedOrganizationId = id;
      if (id) {
        this.store.dispatch(new ProjectsAction.GetCodes({organizationId: id}));
        this.store.dispatch(new ProjectsAction.Get({organizationId: id}));
      }
    }));
    this.subscriptions.add(
      this.store.select(selectSelectedProjectId).subscribe(id => {
        this.selectedProjectId = id;
      })
    );
  }
}
