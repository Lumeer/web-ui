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

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {HtmlModifier} from '../../shared/utils/html-modifier';
import {KeycloakSettings} from '../keycloak.settings';
import {AppState} from '../store/app.state';
import {selectNavigation} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {selectOrganizationByCode} from '../store/organizations/organizations.state';
import {ProjectsAction} from '../store/projects/projects.action';
import {selectProjectByCode} from '../store/projects/projects.state';
import {RouterAction} from '../store/router/router.action';
import {UserSettingsService} from '../user-settings.service';
import {first} from 'rxjs/operators';

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss']
})
export class TopPanelComponent implements OnInit {

  public licence = 'trial';

  public searchBoxHidden = false;
  public notifications = 0;

  public workspace: Workspace;

  public notificationsDisabled: boolean;

  public buildNumber = BUILD_NUMBER;

  constructor(private store: Store<AppState>,
              private router: Router,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    this.store.select(selectNavigation).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.searchBoxHidden = navigation.searchBoxHidden;
    });
    this.notificationsDisabled = this.userSettingsService.getUserSettings().notificationsDisabled;
  }

  public disableNotifications() {
    const userSettings = this.userSettingsService.getUserSettings();
    userSettings.notificationsDisabled = !this.notificationsDisabled;
    this.userSettingsService.updateUserSettings(userSettings);
  }

  public goToWorkspaceOrganization(): void {
    this.goToWorkspace(false);
  }

  public goToWorkspaceProject(): void {
    this.goToWorkspace(true);
  }

  private goToWorkspace(selectProject: boolean) {
    Observable.combineLatest(
      this.store.select(selectOrganizationByCode(this.workspace.organizationCode)),
      this.store.select(selectProjectByCode(this.workspace.projectCode))
    ).pipe(first())
      .subscribe(([organization, project]) => {
      if (organization && project) {
        this.store.dispatch(new OrganizationsAction.Select({organizationId: organization.id}));
        this.store.dispatch(new ProjectsAction.Select({projectId: selectProject ? project.id : null}));
        this.store.dispatch(new RouterAction.Go({path: ['workspace']}));
      }
    });
  }

  public isWorkspaceSet(): boolean {
    return !!this.workspace && !!this.workspace.organizationCode && !!this.workspace.projectCode;
  }

  public isSearchBoxShown(): boolean {
    return this.isWorkspaceSet() && !this.searchBoxHidden;
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  public workspacePath(): string {
    return `w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public keycloakAccountUrl(): string {
    return `${KeycloakSettings.getAuthServerUrl()}/realms/lumeer/account`;
  }

  public keycloakSignOutUrl(): string {
    return `${KeycloakSettings.getAuthServerUrl()}/realms/lumeer/protocol/openid-connect/logout?redirect_uri=http%3A%2F%2Fwww.lumeer.io%2F`;
  }

}
