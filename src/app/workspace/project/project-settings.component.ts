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

import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';

import {Collection, Project} from '../../core/dto';
import {CollectionService, ProjectService} from '../../core/rest';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {filter, map} from 'rxjs/operators';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {Observable} from 'rxjs/Observable';
import {ResourceType} from '../../core/model/resource-type';
import {selectProjectByWorkspace, selectProjectsForWorkspace} from '../../core/store/projects/projects.state';
import {isNullOrUndefined} from "util";
import {Subscription} from 'rxjs/Subscription';
import {ProjectModel} from '../../core/store/projects/project.model';
import {selectAllUsers} from '../../core/store/users/users.state';
import {ProjectsAction} from '../../core/store/projects/projects.action';

@Component({
  templateUrl: './project-settings.component.html'
})
export class ProjectSettingsComponent implements OnInit {

  public userCount$: Observable<number>;
  public collectionsCount$: Observable<number>;
  public project: ProjectModel;

  private projectSubscription: Subscription;

  constructor(private i18n: I18n,
              private router: Router,
              private store: Store<AppState>,
              private notificationService: NotificationService) {
  }

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy() {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
  }

  private subscribeToStore() {
    this.userCount$ = this.store.select(selectAllUsers)
      .pipe(map(users => users ? users.length : 0));

    // this.collectionsCount$ = this.store.select(selectProjectsForWorkspace)
    //   .pipe(map(projects => projects ? projects.length : 0));

    this.projectSubscription = this.store.select(selectProjectByWorkspace)
      .pipe(filter(project => !isNullOrUndefined(project)))
      .subscribe(project => this.project = project);
  }

  public getResourceType(): ResourceType {
    return ResourceType.Project;
  }

  public onDelete(): void {
    const message = this.i18n({id: 'project.delete.dialog.message', value: 'Project is about to be permanently deleted.'});
    const title = this.i18n({id: 'project.delete.dialog.title', value: 'Delete project?'});
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(
      message,
      title,
      [
        {text: yesButtonText, action: () => this.deleteProject(), bold: false},
        {text: noButtonText}
      ]
    );
  }

  private deleteProject() {
    this.store.dispatch(new ProjectsAction.Delete({organizationId: this.project.id, projectId: this.project.id}));
    this.goBack();
  }

  public onNewDescription(newDescription: string) {
    const projectCopy = {...this.project, description: newDescription};
    this.updateProject(projectCopy);
  }

  public onNewName(name: string) {
    const projectCopy = {...this.project, name};
    this.updateProject(projectCopy);
  }

  public onNewCode(code: string) {
    const projectCopy = {...this.project, code};
    this.updateProject(projectCopy);
  }

  public onNewIcon(icon: string) {
    const projectCopy = {...this.project, icon};
    this.updateProject(projectCopy);
  }

  public onNewColor(color: string) {
    const projectCopy = {...this.project, color};
    this.updateProject(projectCopy);
  }

  private updateProject(project: ProjectModel) {
    this.store.dispatch(new ProjectsAction.Update({project}));
  }

  public onProjectsClick() {
    this.goBack();
  }

  public goBack(): void {
    this.router.navigate(['/workspace']);
  }
}
