/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, first, map, take, takeUntil} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {
  selectNavigatingToOtherWorkspace,
  selectPreviousWorkspaceUrl,
  selectWorkspace,
} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {Project} from '../../core/store/projects/project';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {selectProjectByWorkspace, selectProjectsCodesForOrganization} from '../../core/store/projects/projects.state';
import {selectAllUsers} from '../../core/store/users/users.state';
import {Perspective} from '../../view/perspectives/perspective';
import {replaceWorkspacePathInUrl} from '../../shared/utils/data.utils';
import {SearchTab} from '../../core/store/navigation/search-tab';
import {ModalService} from '../../shared/modal/modal.service';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {TextInputModalComponent} from '../../shared/modal/text-input/text-input-modal.component';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {selectProjectPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {getLastUrlPart} from '../../shared/utils/common.utils';
import {ProjectService} from '../../core/data-service';
import {FileApiService} from '../../core/service/file-api.service';
import {HttpEvent, HttpEventType} from '@angular/common/http';
import {selectWorkspaceModels} from '../../core/store/common/common.selectors';

@Component({
  templateUrl: './project-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsComponent implements OnInit, OnDestroy {
  public userCount$: Observable<number>;
  public projectCodes$: Observable<string[]>;
  public project$ = new BehaviorSubject<Project>(null);
  public permissions$: Observable<AllowedPermissions>;
  public uploadProgress$ = new BehaviorSubject<number>(null);

  public readonly projectType = ResourceType.Project;

  private previousUrl: string;
  private workspace: Workspace;
  private subscriptions = new Subscription();

  private modalRef: BsModalRef;
  private deleteSamplesTitle = '';
  private deleteSamplesDescription = '';
  private deleteSamplesPlaceholder = '';

  constructor(
    private router: Router,
    private store$: Store<AppState>,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private modalService: ModalService,
    private projectService: ProjectService,
    private fileApiService: FileApiService
  ) {}

  public ngOnInit() {
    this.subscribeToStore();

    this.deleteSamplesDescription = $localize`:@@project.deleteSamples.dialog.description:All sample project records will be permanently deleted. Type PERMANENTLY CLEAN to proceed.`;
    this.deleteSamplesTitle = $localize`:@@project.deleteSamples.dialog.title:Do you want to erase all sample data in the project?`;
    this.deleteSamplesPlaceholder = $localize`:@@project.deleteSamples.dialog.placeholder:PERMANENTLY CLEAN`;
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onDelete() {
    const message = $localize`:@@project.delete.dialog.message:Do you really want to permanently delete this project?`;
    const title = $localize`:@@project.delete.dialog.title:Delete project?`;

    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.deleteProject());
  }

  public onCollectionsClick() {
    const organizationCode = this.workspace && this.workspace.organizationCode;
    const project = this.project$.getValue();
    const projectCode = project && project.code;
    if (organizationCode && projectCode) {
      this.router.navigate(['/w', organizationCode, projectCode, 'view', Perspective.Search, SearchTab.Collections]);
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

  public onNewColorOrIcon(event: {color: string; icon: string}) {
    const {color, icon} = event;
    const collection = {...this.project$.getValue(), color, icon};
    this.updateProject(collection);
  }

  public goBack() {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: replaceWorkspacePathInUrl(this.previousUrl, this.workspace),
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
          this.project$.next({...project});
          this.projectCodes$ = this.store$.pipe(
            select(selectProjectsCodesForOrganization(project.organizationId)),
            map(codes => (codes && codes.filter(code => code !== project.code)) || [])
          );
        })
    );

    this.permissions$ = this.store$.pipe(select(selectProjectPermissions));

    this.subscriptions.add(
      this.permissions$
        .pipe(
          takeUntil(
            this.store$.pipe(
              select(selectNavigatingToOtherWorkspace),
              filter(navigating => navigating)
            )
          )
        )
        .subscribe(permissions => this.checkCurrentTab(permissions))
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
      this.store$.pipe(select(selectPreviousWorkspaceUrl), take(1)).subscribe(url => (this.previousUrl = url))
    );
  }

  private checkCurrentTab(permissions: AllowedPermissions) {
    const currentTab = getLastUrlPart(this.router.url);
    if (this.isInTabWithoutPermissions(permissions, currentTab)) {
      this.navigateToAnyTab(permissions);
    }
  }

  private isInTabWithoutPermissions(permissions: AllowedPermissions, tab: string) {
    switch (tab) {
      case 'sequences':
      case 'template':
        return !permissions?.roles?.TechConfig;
      case 'users':
      case 'teams':
        return !permissions?.roles?.UserConfig;
      default:
        return false;
    }
  }

  private navigateToAnyTab(permissions: AllowedPermissions) {
    if (permissions?.roles?.UserConfig) {
      this.router.navigate(['users'], {relativeTo: this.route});
    } else if (permissions?.roles?.TechConfig) {
      this.router.navigate(['sequences'], {relativeTo: this.route});
    } else {
      this.goBack();
    }
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

  public onSampleDataEraseClick() {
    this.modalRef = this.modalService.show(TextInputModalComponent, {
      keyboard: true,
      backdrop: 'static',
      initialState: {
        title: this.deleteSamplesTitle,
        description: this.deleteSamplesDescription,
        placeholder: this.deleteSamplesPlaceholder,
        validationFunction: content => content === this.deleteSamplesPlaceholder,
      },
    });

    this.subscriptions.add(
      this.modalRef.content.onSave$.subscribe(value =>
        this.store$.dispatch(
          new ProjectsAction.DeleteSampleData({
            organizationId: this.project$.getValue().organizationId,
            projectId: this.project$.getValue().id,
          })
        )
      )
    );
  }

  public onDownloadRawContent() {
    this.store$.pipe(select(selectWorkspaceModels), first()).subscribe(models => {
      this.store$.dispatch(
        new ProjectsAction.DownloadRawContent({
          organizationId: models.organization.id,
          projectId: models.project.id,
          projectName: (models.project.code?.toLocaleLowerCase() || 'project') + '.json',
        })
      );
    });
  }

  public uploadRawProjectContent(file: File) {
    this.store$.pipe(select(selectWorkspaceModels), first()).subscribe(models => {
      const url = this.projectService.getUploadRawContentUrl(models.organization.id, models.project.id);

      if (!!url) {
        this.fileApiService.postFileWithProgress(url, file.type, file).subscribe(
          (event: HttpEvent<any>) => {
            switch (event.type) {
              case HttpEventType.Response:
                this.uploadProgress$.next(null);
                const successMessage = $localize`:@@project.settings.upload.success:The new project content was successfully added.`;
                this.notificationService.success(successMessage);
                return;
              case HttpEventType.UploadProgress:
                this.uploadProgress$.next(Math.round((event.loaded / event.total) * 100));
                return;
            }
          },
          () => {
            const errorMessage = $localize`:@@project.settings.upload.error:I was not possible to upload and process this project file.`;
            this.notificationService.error(errorMessage);
          }
        );
      }
    });
  }
}
