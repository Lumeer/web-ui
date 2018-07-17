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
import {I18n} from '@ngx-translate/i18n-polyfill';

import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {filter, map, take} from 'rxjs/operators';
import {Observable, Subscription} from 'rxjs';
import {ResourceType} from '../../core/model/resource-type';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {isNullOrUndefined} from 'util';
import {ProjectModel} from '../../core/store/projects/project.model';
import {selectAllUsers} from '../../core/store/users/users.state';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {ViewsAction} from '../../core/store/views/views.action';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {selectPreviousUrl, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Perspective} from '../../view/perspectives/perspective';
import {Location} from '@angular/common';

@Component({
  templateUrl: './project-settings.component.html'
})
export class ProjectSettingsComponent implements OnInit {

  public userCount$: Observable<number>;
  public project: ProjectModel;
  public workspace: Workspace;

  private subscription = new Subscription();
  private previousUrl: string;

  constructor(private i18n: I18n,
              private router: Router,
              private store: Store<AppState>,
              private notificationService: NotificationService,
              private location: Location) {
  }

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
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

  public onCollectionsClick() {
    const organizationCode = this.workspace && this.workspace.organizationCode;
    const projectCode = this.project && this.project.code;
    if (organizationCode && projectCode) {
      this.clearStore();
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
    if (this.previousUrl && this.previousUrl !== '/') {
      const urls = this.previousUrl.split('?', 2);
      const params = this.router.parseUrl(this.previousUrl).queryParams;
      const queryParams = urls.length > 1 ? {queryParams: params} : undefined;
      this.router.navigate([urls[0]], queryParams);
    } else {
      this.router.navigate(['w', this.workspace.organizationCode, this.workspace.projectCode, 'view', Perspective.Search, 'all']);
    }
  }

  private subscribeToStore() {
    this.userCount$ = this.store.select(selectAllUsers)
      .pipe(map(users => users ? users.length : 0));

    this.subscription.add(this.store.select(selectProjectByWorkspace)
      .pipe(filter(project => !isNullOrUndefined(project)))
      .subscribe(project => this.project = project)
    );

    this.subscription.add(this.store.select(selectWorkspace)
      .pipe(filter(workspace => !isNullOrUndefined(workspace)))
      .subscribe(workspace => this.workspace = workspace)
    );

    this.store.select(selectPreviousUrl).pipe(take(1))
      .subscribe(url => this.previousUrl = url);
  }

  private clearStore() {
    this.store.dispatch(new CollectionsAction.Clear());
    this.store.dispatch(new DocumentsAction.Clear());
    this.store.dispatch(new LinkInstancesAction.Clear());
    this.store.dispatch(new LinkTypesAction.Clear());
    this.store.dispatch(new ViewsAction.Clear());
  }

  private deleteProject() {
    this.store.dispatch(new ProjectsAction.Delete({organizationId: this.project.organizationId, projectId: this.project.id}));
    this.goBack();
  }

  private updateProject(project: ProjectModel) {
    this.store.dispatch(new ProjectsAction.Update({project}));
  }
}
