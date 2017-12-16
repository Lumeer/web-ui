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
import {Subscription} from 'rxjs/Subscription';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../core/store/app.state';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {
  selectAllOrganizations,
  selectSelectedOrganizationCode
} from '../../core/store/organizations/organizations.state';
import {ProjectModel} from '../../core/store/projects/project.model';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {
  selectProjectsForSelectedOrganization,
  selectSelectedProjectCode
} from '../../core/store/projects/projects.state';
import {RouterAction} from '../../core/store/router/router.action';
import {UserSettingsService} from '../../core/user-settings.service';
import {Role} from '../../shared/permissions/role';

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

  public selectedOrganizationCode: string;
  public selectedProjectCode: string;

  private subscriptions: Subscription[] = [];

  constructor(private store: Store<AppState>,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    this.organizations$ = this.store.select(selectAllOrganizations);
    this.projects$ = this.store.select(selectProjectsForSelectedOrganization); // TODO use selector for organizations?
    this.subscriptions.push(
      this.store.select(selectSelectedOrganizationCode).subscribe(code => {
        this.selectedOrganizationCode = code;
        if (code) {
          this.store.dispatch(new ProjectsAction.Get({organizationCode: code}));
        }
      }),
      this.store.select(selectSelectedProjectCode).subscribe(code => this.selectedProjectCode = code)
    );
    this.store.dispatch(new OrganizationsAction.Get());
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public onSelectOrganization(code: string) {
    this.store.dispatch(new OrganizationsAction.Select({organizationCode: code}));
    this.store.dispatch(new ProjectsAction.Select({projectCode: null}));
  }

  public onCreateOrganization() {
    // TODO
  }

  public onOrganizationSettings(code: string) {
    this.store.dispatch(new RouterAction.Go({path: ['organization', code]}));
  }

  public onNewOrganizationDescription(description: string) {
    // TODO save for selected organization ix
  }

  public onSelectProject(code: string) {
    this.store.dispatch(new ProjectsAction.Select({projectCode: code}));
  }

  public onCreateProject() {
    // TODO
  }

  public onProjectSettings(code: string) {
    if (!isNullOrUndefined(this.selectedOrganizationCode)) {
      this.store.dispatch(new RouterAction.Go({path: ['organization', this.selectedOrganizationCode, 'project', code]}));
    }
  }

  public onNewProjectDescription(description: string) {
    // TODO save for selected project ix
  }

  public hasManageRole(organization: OrganizationModel) {
    return organization.permissions && organization.permissions.users.length === 1
      && organization.permissions.users[0].roles.some(r => r === Role.Manage.toString());
  }

  public onSaveActiveItems() {
    if (!isNullOrUndefined(this.selectedOrganizationCode) && !isNullOrUndefined(this.selectedProjectCode)) {
      this.updateDefaultWorkspace(this.selectedOrganizationCode, this.selectedProjectCode);
      this.store.dispatch(new RouterAction.Go({path: ['w', this.selectedOrganizationCode, this.selectedProjectCode, 'collections']}));
    }
  }

  private updateDefaultWorkspace(organizationCode: string, projectCode: string) {
    let userSettings = this.userSettingsService.getUserSettings();
    userSettings.defaultOrganization = organizationCode;
    userSettings.defaultProject = projectCode;
    this.userSettingsService.updateUserSettings(userSettings);
  }

}
