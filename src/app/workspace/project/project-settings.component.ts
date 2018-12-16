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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectPreviousUrl, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {Project} from '../../core/store/projects/project';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {selectProjectByWorkspace, selectProjectsCodesForOrganization} from '../../core/store/projects/projects.state';
import {selectAllUsers} from '../../core/store/users/users.state';
import {Perspective} from '../../view/perspectives/perspective';

@Component({
  templateUrl: './project-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsComponent implements OnInit {
  public userCount$: Observable<number>;
  public projectCodes$: Observable<string[]>;
  public project$ = new BehaviorSubject<Project>(null);

  public readonly projectType = ResourceType.Project;

  private previousUrl: string;
  private workspace: Workspace;
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
    const project = this.project$.getValue();
    const projectCode = project && project.code;
    if (organizationCode && projectCode) {
      this.router.navigate(['/w', organizationCode, projectCode, 'view', Perspective.Search, 'collections']);
    }
  }

  public onNewDescription(newDescription: string) {
    const projectCopy = {...this.project$.getValue(), description: newDescription};
    this.updateProject(projectCopy);
  }

  public onNewName(name: string) {
    const projectCopy = {...this.project$.getValue(), name};
    this.updateProject(projectCopy);
  }

  public onNewCode(code: string) {
    const projectCopy = {...this.project$.getValue(), code};
    this.updateProject(projectCopy);
  }

  public onNewIcon(icon: string) {
    const projectCopy = {...this.project$.getValue(), icon};
    this.updateProject(projectCopy);
  }

  public onNewColor(color: string) {
    const projectCopy = {...this.project$.getValue(), color};
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
    this.userCount$ = this.store$.pipe(
      select(selectAllUsers),
      map(users => (users ? users.length : 0))
    );

    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectProjectByWorkspace),
          filter(project => !!project)
        )
        .subscribe(project => {
          this.project$.next(project);
          this.projectCodes$ = this.store$.pipe(
            select(selectProjectsCodesForOrganization(project.organizationId)),
            map(codes => (codes && codes.filter(code => code !== project.code)) || [])
          );
        })
    );

    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectWorkspace),
          filter(workspace => !!workspace)
        )
        .subscribe(workspace => (this.workspace = workspace))
    );

    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectPreviousUrl),
          take(1)
        )
        .subscribe(url => (this.previousUrl = url))
    );
  }

  private deleteProject() {
    this.store$.dispatch(
      new ProjectsAction.Delete({
        organizationId: this.project$.getValue().organizationId,
        projectId: this.project$.getValue().id,
      })
    );
  }

  private updateProject(project: Project) {
    this.store$.dispatch(new ProjectsAction.Update({project}));
  }
}
