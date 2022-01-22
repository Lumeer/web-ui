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

import {Component, OnInit, ChangeDetectionStrategy, Input, ViewChild} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Project} from '../../../core/store/projects/project';
import {LoadingState} from '../../../core/model/loading-state';
import {
  selectProjectTemplates,
  selectProjectTemplatesLoadingState,
  selectReadableProjects,
} from '../../../core/store/projects/projects.state';
import {CreateProjectTemplatesComponent} from './templates/create-project-templates.component';
import {FormBuilder, Validators} from '@angular/forms';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';
import {ProjectsAction} from '../../../core/store/projects/projects.action';
import {NavigationExtras} from '@angular/router';
import {Organization} from '../../../core/store/organizations/organization';
import {CreateProjectService} from '../../../core/service/create-project.service';
import {OrganizationsAction} from '../../../core/store/organizations/organizations.action';

@Component({
  templateUrl: './create-project-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectModalComponent implements OnInit {
  @Input()
  public organizations: Organization[];

  @Input()
  public templateCode: string;

  @Input()
  public navigationExtras: NavigationExtras;

  @ViewChild(CreateProjectTemplatesComponent)
  public templatesComponent: CreateProjectTemplatesComponent;

  public onClose$ = new Subject();

  public templates$: Observable<Project[]>;
  public templatesState$: Observable<LoadingState>;
  public projectsCount$: Observable<number>;

  public performingAction$ = new BehaviorSubject(false);
  public performingSecondaryAction$ = new BehaviorSubject(false);

  public form = this.fb.group({
    templateSelected: [false, Validators.requiredTrue],
  });
  public formDisabled$ = this.form.statusChanges.pipe(
    startWith('INVALID'),
    distinctUntilChanged(),
    map(status => status === 'INVALID')
  );

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private fb: FormBuilder,
    private createProjectService: CreateProjectService
  ) {}

  public ngOnInit() {
    this.templates$ = this.store$.pipe(select(selectProjectTemplates));
    this.templatesState$ = this.store$.pipe(select(selectProjectTemplatesLoadingState));
    this.projectsCount$ = this.store$.pipe(
      select(selectReadableProjects),
      map(projects => (projects ? projects.length : 0))
    );

    this.store$.dispatch(new ProjectsAction.GetCodes({organizationIds: this.organizations.map(org => org.id)}));
  }

  public onSubmit() {
    const template = this.templatesComponent.selectedTemplate$.value;
    if (this.organizations.length === 1) {
      this.performingAction$.next(true);
      this.createProject(template);
    } else {
      this.chooseOrganization(template);
    }
  }

  public onSecondarySubmit() {
    if (this.organizations.length === 1) {
      this.performingSecondaryAction$.next(true);
      this.createProject();
    } else {
      this.chooseOrganization();
    }
  }

  private onFailure() {
    this.performingAction$.next(false);
    this.performingSecondaryAction$.next(false);
  }

  private createProject(template?: Project) {
    const code = template?.code || 'EMPTY';
    this.createProjectService.createProjectInOrganization(this.organizations[0], code, {
      templateId: template?.id,
      navigationExtras: this.navigationExtras,
      onSuccess: () => this.hideDialog(),
      onFailure: () => this.onFailure(),
    });
  }

  private chooseOrganization(template?: Project) {
    this.hideDialog();

    this.store$.dispatch(
      new OrganizationsAction.Choose({
        organizations: this.organizations,
        initialCode: template?.code || 'EMPTY',
        templateId: template?.id,
        onClose$: this.onClose$,
        navigationExtras: this.navigationExtras,
      })
    );
  }

  public onClose() {
    this.onClose$.next(null);
    this.hideDialog();
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }
}
