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
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, Subscription} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectPreviousUrl, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {ProjectModel} from '../../core/store/projects/project.model';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {selectProjectByWorkspace, selectProjectsCodesForOrganization} from '../../core/store/projects/projects.state';
import {selectAllUsers} from '../../core/store/users/users.state';
import {Perspective} from '../../view/perspectives/perspective';

@Component({
  templateUrl: './project-settings.component.html',
})
export class ProjectSettingsComponent implements OnInit {
  public userCount$: Observable<number>;
  public projectCodes$: Observable<string[]>;
  public project: ProjectModel;
  public workspace: Workspace;

  private previousUrl: string;

  private subscriptions = new Subscription();

  constructor(
    private i18n: I18n,
    private router: Router,
    private store$: Store<AppState>,
    private notificationService: NotificationService
  ) {}

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public getResourceType(): ResourceType {
    return ResourceType.Project;
  }

  public onDelete(): void {
    const message = this.i18n({
      id: 'project.delete.dialog.message',
      value: 'Do you really want to permanently delete this project?',
    });
    const title = this.i18n({id: 'project.delete.dialog.title', value: 'Delete project?'});
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText},
      {text: yesButtonText, action: () => this.deleteProject(), bold: false},
    ]);
  }

  public onCollectionsClick() {
    const organizationCode = this.workspace && this.workspace.organizationCode;
    const projectCode = this.project && this.project.code;
    if (organizationCode && projectCode) {
      this.router.navigate(['/w', organizationCode, projectCode, 'view', Perspective.Search, 'collections']);
    }
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

  public goBack(): void {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: this.previousUrl,
        organizationCode: this.workspace.organizationCode,
        projectCode: this.workspace.projectCode,
      })
    );
  }

  private subscribeToStore() {
    this.userCount$ = this.store$.select(selectAllUsers).pipe(map(users => (users ? users.length : 0)));

    this.subscriptions.add(
      this.store$
        .select(selectProjectByWorkspace)
        .pipe(filter(project => !isNullOrUndefined(project)))
        .subscribe(project => {
          this.project = project;
          this.projectCodes$ = this.store$.pipe(
            select(selectProjectsCodesForOrganization(project.organizationId)),
            map(codes => (codes && codes.filter(code => code !== project.code)) || [])
          );
        })
    );

    this.subscriptions.add(
      this.store$
        .select(selectWorkspace)
        .pipe(filter(workspace => !isNullOrUndefined(workspace)))
        .subscribe(workspace => (this.workspace = workspace))
    );

    this.subscriptions.add(
      this.store$
        .select(selectPreviousUrl)
        .pipe(take(1))
        .subscribe(url => (this.previousUrl = url))
    );
  }

  private deleteProject() {
    this.store$.dispatch(
      new ProjectsAction.Delete({
        organizationId: this.project.organizationId,
        projectId: this.project.id,
        onSuccess: () => this.router.navigate(['/']),
      })
    );
  }

  private updateProject(project: ProjectModel) {
    this.store$.dispatch(new ProjectsAction.Update({project}));
  }
}
