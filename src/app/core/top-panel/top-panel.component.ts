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

import {AfterViewChecked, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';

import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/internal/Observable';
import {filter, map, take} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {environment} from '../../../environments/environment';
import {HtmlModifier} from '../../shared/utils/html-modifier';
import {Resource} from '../dto';
import {KeycloakSettings} from '../keycloak.settings';
import {ResourceType} from '../model/resource-type';
import {AppState} from '../store/app.state';
import {CollectionsAction} from '../store/collections/collections.action';
import {DocumentsAction} from '../store/documents/documents.action';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';
import {LinkTypesAction} from '../store/link-types/link-types.action';
import {selectNavigation} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {OrganizationModel} from '../store/organizations/organization.model';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {selectOrganizationByWorkspace} from '../store/organizations/organizations.state';
import {ProjectModel} from '../store/projects/project.model';
import {ProjectsAction} from '../store/projects/projects.action';
import {selectProjectByWorkspace, selectProjectsByOrganizationId} from '../store/projects/projects.state';
import {RouterAction} from '../store/router/router.action';
import {UsersAction} from '../store/users/users.action';
import {ViewsAction} from '../store/views/views.action';
import {UserSettingsService} from '../user-settings.service';
import {TopPanelService} from './top-panel.service';

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss']
})
export class TopPanelComponent implements OnInit, AfterViewChecked {

  private readonly keycloakUrl = KeycloakSettings.getAuthServerUrl();
  public readonly keycloakAccountUrl = `${this.keycloakUrl}/realms/lumeer/account`;
  public readonly keycloakSignOutUrl = `${this.keycloakUrl}/realms/lumeer/protocol/openid-connect/logout?redirect_uri=http%3A%2F%2Fwww.lumeer.io%2F`;

  @ViewChild('workspacePanel')
  public workspacePanel: ElementRef;

  public sideWidth$: Observable<number>;

  public searchBoxHidden = false;
  public notifications = 0;

  public workspace: Workspace;
  public organization: OrganizationModel;
  public project: ProjectModel;

  private subscriptions = new Subscription();

  public notificationsDisabled: boolean;

  public buildNumber = environment.buildNumber;

  public readonly organizationResourceType = ResourceType.Organization;
  public readonly projectResourceType = ResourceType.Project;

  constructor(private store: Store<AppState>,
              private router: Router,
              private topPanelService: TopPanelService,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    this.sideWidth$ = this.topPanelService.sideWidth$;

    this.subscribeToNavigation();
    this.subscribeToOrganization();
    this.subscribeToProject();

    this.notificationsDisabled = this.userSettingsService.getUserSettings().notificationsDisabled;
  }

  private subscribeToNavigation() {
    this.subscriptions.add(
      this.store.select(selectNavigation).subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.searchBoxHidden = navigation.searchBoxHidden;
      })
    );
  }

  private subscribeToOrganization() {
    this.subscriptions.add(
      this.store.select(selectOrganizationByWorkspace).subscribe(organization => this.organization = organization)
    );
  }

  private subscribeToProject() {
    this.subscriptions.add(
      this.store.select(selectProjectByWorkspace).subscribe(project => this.project = project)
    );
  }

  public ngAfterViewChecked() {
    this.topPanelService.updateSideWidth(this.workspacePanel.nativeElement.clientWidth);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
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
    if (this.organization && this.project) {
      this.store.dispatch(new OrganizationsAction.Select({organizationId: this.organization.id}));
      this.store.dispatch(new ProjectsAction.Select({projectId: selectProject ? this.project.id : null}));
      this.store.dispatch(new RouterAction.Go({path: ['workspace']}));
    }
  }

  public isWorkspaceSet(): boolean {
    return !!this.workspace && !!this.workspace.organizationCode && !!this.workspace.projectCode;
  }

  public isSearchBoxShown(): boolean {
    return this.isWorkspaceSet() && !this.searchBoxHidden;
  }

  public goToOrganization(code: string) {
    if (this.workspace && this.workspace.organizationCode) {
      this.router.navigate(['w', this.workspace.organizationCode, code]);
    }
  }

  public goToProject(organization: OrganizationModel, project: ProjectModel) {
    if (organization && project) {
      this.updateDefaultWorkspace(organization, project);
      this.clearStore();
      this.store.dispatch(new OrganizationsAction.Select({organizationId: organization.id}));
      this.store.dispatch(new ProjectsAction.Select({projectId: project.id}));
      this.store.dispatch(new RouterAction.Go({path: ['w', organization.code, project.code, 'view', 'search', 'all']}));
    }
  }

  private clearStore() {
    this.store.dispatch(new CollectionsAction.Clear());
    this.store.dispatch(new DocumentsAction.Clear());
    this.store.dispatch(new LinkInstancesAction.Clear());
    this.store.dispatch(new LinkTypesAction.Clear());
    this.store.dispatch(new ViewsAction.Clear());
  }

  private updateDefaultWorkspace(organization: OrganizationModel, project: ProjectModel) {
    const defaultWorkspace = {
      organizationId: organization.id,
      organizationCode: organization.code,
      projectId: project.id,
      projectCode: project.code
    };
    this.store.dispatch(new UsersAction.SaveDefaultWorkspace({defaultWorkspace}));
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  public workspacePath(): string {
    return `w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public selectOrganization(organization: Resource): void {
    this.store.dispatch(new ProjectsAction.Get({organizationId: organization.id}));

    this.store.select(selectProjectsByOrganizationId(organization.id)).pipe(
      filter(projects => !isNullOrUndefined(projects)),
      take(1),
      map(projects => projects.length > 0 ? projects[0] : undefined)
    ).subscribe(project => {
      if (project) {
        this.goToProject(organization as OrganizationModel, project);
      } else {
        this.createNewProject(organization);
      }
    });
  }

  public selectProject(project: Resource): void {
    this.goToProject(this.organization, project as ProjectModel);
  }

  public createNewOrganization(): void {
    // TODO call create dialog
  }

  public createNewProject(parentOrganization: OrganizationModel): void {
    // TODO call create dialog
  }
}
