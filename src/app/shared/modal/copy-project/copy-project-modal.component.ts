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

import {Component, OnInit, ChangeDetectionStrategy, Input, HostListener, OnDestroy} from '@angular/core';
import {Organization} from '../../../core/store/organizations/organization';
import {BehaviorSubject, Observable, of, Subject, Subscription} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {KeyCode} from '../../key-code';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Project} from '../../../core/store/projects/project';
import {ProjectConverter} from '../../../core/store/projects/project.converter';
import {NavigationExtras} from '@angular/router';
import {ProjectsAction} from '../../../core/store/projects/projects.action';
import {CreateProjectService} from '../../../core/service/create-project.service';
import {OrganizationsAction} from '../../../core/store/organizations/organizations.action';
import {PublicProjectService} from '../../../core/data-service/project/public-project.service';

@Component({
  templateUrl: './copy-project-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PublicProjectService],
})
export class CopyProjectModalComponent implements OnInit, OnDestroy {
  @Input()
  public organizations: Organization[];

  @Input()
  public organizationId: string;

  @Input()
  public projectId: string;

  @Input()
  public navigationExtras: NavigationExtras;

  private subscriptions = new Subscription();

  public project$: Observable<Project>;

  public performingAction$ = new BehaviorSubject(false);
  public onClose$ = new Subject();

  constructor(
    private projectService: PublicProjectService,
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private createProjectService: CreateProjectService
  ) {}

  public ngOnInit() {
    this.project$ = this.projectService.getProject(this.organizationId, this.projectId).pipe(
      map(dto => ProjectConverter.fromDto(dto, this.organizationId)),
      catchError(() => of(null))
    );

    this.store$.dispatch(new ProjectsAction.GetCodes({organizationIds: this.organizations.map(org => org.id)}));
  }

  public onSubmit(project: Project) {
    if (this.organizations.length === 1) {
      this.createProject(project);
    } else {
      this.chooseOrganization(project);
    }
  }

  private createProject(copyProject: Project) {
    this.performingAction$.next(true);
    this.createProjectService.createProjectInOrganization(this.organizations[0], copyProject?.code, {
      copyProject,
      navigationExtras: this.navigationExtras,
      onSuccess: () => this.hideDialog(),
      onFailure: () => this.performingAction$.next(false),
    });
  }

  private chooseOrganization(copyProject: Project) {
    this.hideDialog();

    const dialogState = {organizationId: this.organizationId, projectId: this.projectId};

    this.store$.dispatch(
      new OrganizationsAction.Choose({
        organizations: this.organizations,
        initialCode: copyProject.code,
        copyProject,
        onClose$: this.onClose$,
        previousDialogState: dialogState,
        navigationExtras: this.navigationExtras,
      })
    );
  }

  public onClose() {
    this.onClose$.next();
    this.hideDialog();
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.onClose();
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
