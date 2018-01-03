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
import {first, map} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../core/store/app.state';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {
  selectAllOrganizations, selectSelectedOrganization,
  selectSelectedOrganizationId
} from '../../core/store/organizations/organizations.state';
import {ProjectModel} from '../../core/store/projects/project.model';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {
  selectProjectsForSelectedOrganization, selectSelectedProject,
  selectSelectedProjectId
} from '../../core/store/projects/projects.state';
import {RouterAction} from '../../core/store/router/router.action';
import {UserSettingsService} from '../../core/user-settings.service';
import {Role} from '../../shared/permissions/role';
import {ResourceItemType} from './resource-chooser/resource-item-type';

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
  public projects$: Observable<ProjectModel[]>;
  public canCreateProjects$: Observable<boolean>;

  public selectedOrganizationId: string;
  public selectedProjectId: string;

  private subscriptions: Subscription[] = [];

  constructor(private store: Store<AppState>,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    this.bindData();
    this.subscribeCodes();
    this.selectDefault();
    this.store.dispatch(new OrganizationsAction.Get());
  }

  private bindData() {
    this.organizations$ = this.store.select(selectAllOrganizations);
    this.projects$ = this.store.select(selectProjectsForSelectedOrganization);
    this.canCreateProjects$ = this.store.select(selectSelectedOrganization).pipe(
      map(organization => organization && this.hasManageRole(organization))
    );
  }

  private subscribeCodes() {
    this.subscriptions.push(
      this.store.select(selectSelectedOrganizationId).subscribe(id => {
        this.selectedOrganizationId = id;
        if (id) {
          this.store.dispatch(new ProjectsAction.Get({organizationId: id}));
        }
      }),
      this.store.select(selectSelectedProjectId).subscribe(id => {
        this.selectedProjectId = id;
      })
    );
  }

  private selectDefault() {
    let userSettings = this.userSettingsService.getUserSettings();
    if (userSettings.defaultOrganizationId) {
      this.store.dispatch(new OrganizationsAction.Select({organizationId: userSettings.defaultOrganizationId}));
      if (userSettings.defaultProjectId) {
        this.store.dispatch(new ProjectsAction.Select({projectId: userSettings.defaultProjectId}));
      }
    }
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    // TODO get organization by code and select it
    this.store.dispatch(new RouterAction.Go({path: ['organization', id]}));
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
      // TODO get project by code and select it
      this.store.dispatch(new RouterAction.Go({path: ['organization', this.selectedOrganizationId, 'project', id]}));
    }
  }

  public hasManageRole(organization: OrganizationModel) {
    return organization.permissions && organization.permissions.users.length === 1
      && organization.permissions.users[0].roles.some(r => r === Role.Manage.toString());
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
            this.store.dispatch(new RouterAction.Go({path: ['w', organization.code, project.code, 'files']}));
          }
        });
    }
  }

  public organizationItemType(): ResourceItemType {
    return ResourceItemType.Organization;
  }

  public projectItemType(): ResourceItemType {
    return ResourceItemType.Project;
  }

  private updateDefaultWorkspace(organization: OrganizationModel, project: ProjectModel) {
    let userSettings = this.userSettingsService.getUserSettings();
    userSettings.defaultOrganization = organization.code;
    userSettings.defaultOrganizationId = organization.id;
    userSettings.defaultProject = project.code;
    userSettings.defaultProjectId = project.id;
    this.userSettingsService.updateUserSettings(userSettings);
  }

}
