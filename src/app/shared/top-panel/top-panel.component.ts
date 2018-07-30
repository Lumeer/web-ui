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

import {AfterViewChecked, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, Subscription} from 'rxjs';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {Resource} from '../../core/dto';
import {ServiceLevelType} from '../../core/dto/service-level-type';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {ServiceLimitsAction} from '../../core/store/organizations/service-limits/service-limits.action';
import {selectServiceLimitsByWorkspace} from '../../core/store/organizations/service-limits/service-limits.state';
import {ProjectModel} from '../../core/store/projects/project.model';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {selectProjectByWorkspace, selectProjectsByOrganizationId, selectProjectsLoadedForOrganization} from '../../core/store/projects/projects.state';
import {RouterAction} from '../../core/store/router/router.action';
import {UsersAction} from '../../core/store/users/users.action';
import {ViewsAction} from '../../core/store/views/views.action';
import {UserSettingsService} from '../../core/user-settings.service';
import {DialogService} from '../../dialog/dialog.service';
import {HtmlModifier} from '../utils/html-modifier';

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss']
})
export class TopPanelComponent implements OnInit, AfterViewChecked {

  @Input()
  public searchBoxShown: boolean;

  @ViewChild('workspacePanel')
  public workspacePanel: ElementRef;

  public notifications = 0;

  public workspace: Workspace;
  public organization: OrganizationModel;
  public project: ProjectModel;

  public freePlan$: Observable<boolean>;

  private subscriptions = new Subscription();

  public notificationsDisabled: boolean;

  public readonly organizationResourceType = ResourceType.Organization;
  public readonly projectResourceType = ResourceType.Project;

  constructor(private dialogService: DialogService,
              private i18n: I18n,
              private notificationService: NotificationService,
              private store$: Store<AppState>,
              private router: Router,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit() {
    this.subscribeToNavigation();
    this.subscribeToOrganization();
    this.subscribeToProject();

    this.store$.dispatch(new OrganizationsAction.Get());
    this.store$.dispatch(new ServiceLimitsAction.GetAll());

    this.notificationsDisabled = this.userSettingsService.getUserSettings().notificationsDisabled;

    this.bindServiceLimits();
  }

  private bindServiceLimits() {
    this.freePlan$ = this.store$.select(selectServiceLimitsByWorkspace).pipe(
      map(serviceLimits => serviceLimits && serviceLimits.serviceLevel === ServiceLevelType.FREE)
    );
  }

  private subscribeToNavigation() {
    this.subscriptions.add(
      this.store$.select(selectNavigation).subscribe(navigation => {
        this.workspace = navigation.workspace;
      })
    );
  }

  private subscribeToOrganization() {
    this.subscriptions.add(
      this.store$.select(selectOrganizationByWorkspace).subscribe(organization => this.organization = organization)
    );
  }

  private subscribeToProject() {
    this.subscriptions.add(
      this.store$.select(selectProjectByWorkspace).subscribe(project => this.project = project)
    );
  }

  public ngAfterViewChecked() {
    const width = this.workspacePanel.nativeElement.clientWidth;
    document.body.style.setProperty('--top-panel-side-width', `${width}px`);
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
      this.store$.dispatch(new OrganizationsAction.Select({organizationId: this.organization.id}));
      this.store$.dispatch(new ProjectsAction.Select({projectId: selectProject ? this.project.id : null}));
      this.store$.dispatch(new RouterAction.Go({path: ['workspace']}));
    }
  }

  public goToOrganizationDetail() {
    if (this.workspace && this.workspace.organizationCode) {
      this.router.navigate(['organization', this.workspace.organizationCode, 'detail']);
    }
  }

  public goToProject(organization: OrganizationModel, project: ProjectModel) {
    if (organization && project) {
      this.updateDefaultWorkspace(organization, project);
      this.clearStore();
      this.store$.dispatch(new OrganizationsAction.Select({organizationId: organization.id}));
      this.store$.dispatch(new ProjectsAction.Select({projectId: project.id}));
      this.store$.dispatch(new RouterAction.Go({path: ['w', organization.code, project.code, 'view', 'search', 'all']}));
    }
  }

  private clearStore() {
    this.store$.dispatch(new CollectionsAction.Clear());
    this.store$.dispatch(new DocumentsAction.Clear());
    this.store$.dispatch(new LinkInstancesAction.Clear());
    this.store$.dispatch(new LinkTypesAction.Clear());
    this.store$.dispatch(new ViewsAction.Clear());
  }

  private updateDefaultWorkspace(organization: OrganizationModel, project: ProjectModel) {
    const defaultWorkspace = {
      organizationId: organization.id,
      organizationCode: organization.code,
      projectId: project.id,
      projectCode: project.code
    };
    this.store$.dispatch(new UsersAction.SaveDefaultWorkspace({defaultWorkspace}));
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  public workspacePath(): string {
    return `w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public selectOrganization(organization: OrganizationModel): void {
    this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));

    this.store$.select(selectProjectsLoadedForOrganization(organization.id)).pipe(
      filter(loaded => loaded),
      mergeMap(() => this.store$.select(selectProjectsByOrganizationId(organization.id))),
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
    this.dialogService.openCreateOrganizationDialog(organization => this.onCreateOrganization(organization));
  }

  public createNewProject(parentOrganization: OrganizationModel): void {
    this.dialogService.openCreateProjectDialog(parentOrganization.id, project => this.onCreateProject(parentOrganization, project));
  }

  private onCreateOrganization(organization: OrganizationModel) {
    const successMessage = this.i18n({
      id: 'organization.create.success',
      value: 'Organization was successfully created'
    });

    this.notificationService.success(successMessage);
    this.createNewProject(organization);
  }

  private onCreateProject(organization: OrganizationModel, project: ProjectModel) {
    const successMessage = this.i18n({
      id: 'project.create.success',
      value: 'Project was successfully created'
    });

    this.notificationService.success(successMessage);

    this.goToProject(organization, project);
  }

}
