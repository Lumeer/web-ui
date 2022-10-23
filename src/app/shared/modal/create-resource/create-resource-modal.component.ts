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

import {ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {Action, select, Store} from '@ngrx/store';
import {distinctUntilChanged, filter, map, startWith} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {ResourceType} from '../../../core/model/resource-type';
import {OrganizationsAction} from '../../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../../core/store/projects/projects.action';
import {BehaviorSubject, combineLatest, Observable, of, Subject, Subscription} from 'rxjs';
import {CreateResourceDialogFormComponent} from './form/create-resource-dialog-form.component';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {
  selectAllOrganizations,
  selectOrganizationById,
  selectOrganizationsLoaded,
} from '../../../core/store/organizations/organizations.state';
import {
  selectProjectsByOrganizationId,
  selectProjectsLoadedForOrganization,
} from '../../../core/store/projects/projects.state';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {NavigationExtras} from '@angular/router';
import {AsyncValidatorFn, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {ProjectValidators} from '../../../core/validators/project.validators';
import {OrganizationValidators} from '../../../core/validators/organization.validators';
import {minLengthValidator} from '../../../core/validators/custom-validators';

@Component({
  templateUrl: './create-resource-modal.component.html',
  styleUrls: ['./create-resource-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceModalComponent implements OnInit, OnDestroy {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public parentId: string;

  @Input()
  public callback: (resource: Project | Organization) => void;

  @Input()
  public navigationExtras: NavigationExtras;

  @ViewChild(CreateResourceDialogFormComponent)
  public resourceFormComponent: CreateResourceDialogFormComponent;

  public form: UntypedFormGroup;

  public contentValid$: Observable<boolean>;
  public performingAction$ = new BehaviorSubject(false);
  public usedCodes$: Observable<string[]>;
  public formInvalid$: Observable<boolean>;
  public preventClose$ = new BehaviorSubject(true);

  public onClose$ = new Subject();

  private subscriptions = new Subscription();

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private fb: UntypedFormBuilder,
    private projectValidators: ProjectValidators,
    private organizationValidators: OrganizationValidators
  ) {}

  public ngOnInit() {
    this.createForm();
    this.parseResourceType();
  }

  private createForm() {
    const initialCode = '';

    this.form = this.fb.group({
      code: [initialCode, minLengthValidator(2), this.createAsyncValidator()],
      name: null,
    });

    this.formInvalid$ = this.form.statusChanges.pipe(
      startWith(''),
      map(() => this.form.invalid),
      distinctUntilChanged()
    );
  }

  private createAsyncValidator(): AsyncValidatorFn {
    if (this.resourceType === ResourceType.Organization) {
      return this.organizationValidators.uniqueCode();
    } else if (this.resourceType === ResourceType.Project) {
      this.projectValidators.setOrganizationId(this.parentId);
      return this.projectValidators.uniqueCode();
    }

    return null;
  }

  public onSubmit() {
    this.resourceFormComponent.onSubmit();
  }

  public submitResource(resource: Organization | Project) {
    const action = this.createResourceAction(resource);
    if (action) {
      this.performingAction$.next(true);
      this.store$.dispatch(action);
    } else {
      this.hideDialog();
    }
  }

  private createResourceAction(resource: Organization | Project): Action {
    if (this.resourceType === ResourceType.Organization) {
      return new OrganizationsAction.Create({
        organization: resource,
        onSuccess: organization => this.onCreateResourceSuccess(organization),
        onFailure: () => this.onCreateResourceFailure(),
      });
    } else if (this.resourceType === ResourceType.Project) {
      return new ProjectsAction.Create({
        project: resource,
        navigationExtras: this.navigationExtras,
        onSuccess: project => this.onCreateResourceSuccess(project),
        onFailure: () => this.onCreateResourceFailure(),
      });
    }

    return null;
  }

  private onCreateResourceSuccess(resource: Organization | Project) {
    this.callback?.(resource);
    this.hideDialog();
  }

  private onCreateResourceFailure() {
    this.performingAction$.next(false);
  }

  private parseResourceType() {
    if (this.resourceType === ResourceType.Project) {
      this.contentValid$ = this.store$.pipe(
        select(selectOrganizationById(this.parentId)),
        map(organization => !!organization)
      );
      this.usedCodes$ = this.store$.pipe(
        select(selectProjectsByOrganizationId(this.parentId)),
        map(projects => (projects || []).map(project => project.code))
      );
      this.subscriptions.add(
        this.someProjectExist$(this.parentId).subscribe(exists => this.preventClose$.next(!exists))
      );
    } else {
      this.contentValid$ = of(true);
      this.subscriptions.add(this.someOrganizationExist$().subscribe(exists => this.preventClose$.next(!exists)));
    }
  }

  private someProjectExist$(organizationId: string): Observable<boolean> {
    return combineLatest([
      this.store$.pipe(select(selectProjectsLoadedForOrganization(organizationId))),
      this.store$.pipe(select(selectProjectsByOrganizationId(organizationId))),
    ]).pipe(
      filter(([loaded]) => loaded),
      map(([, projects]) => (projects || []).length > 0)
    );
  }

  private someOrganizationExist$(): Observable<boolean> {
    return combineLatest([
      this.store$.pipe(select(selectOrganizationsLoaded)),
      this.store$.pipe(select(selectAllOrganizations)),
    ]).pipe(
      filter(([loaded]) => loaded),
      map(([, organizations]) => (organizations || []).length > 0)
    );
  }

  public onClose() {
    this.onClose$.next(null);
    this.hideDialog();
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (
      keyboardEventCode(event) === KeyCode.Escape &&
      !this.performingAction$.getValue() &&
      !this.preventClose$.getValue()
    ) {
      this.onClose();
    }
  }
}
