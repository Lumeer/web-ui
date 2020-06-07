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
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Project} from '../../../core/store/projects/project';
import {LoadingState} from '../../../core/model/loading-state';
import {
  selectProjectsCodesForOrganization,
  selectProjectTemplates,
  selectProjectTemplatesLoadingState,
} from '../../../core/store/projects/projects.state';
import {CreateProjectTemplatesComponent} from './templates/create-project-templates.component';
import {FormBuilder, Validators} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';
import {ProjectsAction} from '../../../core/store/projects/projects.action';
import {safeGetRandomIcon} from '../../picker/icons';
import * as Colors from '../../picker/colors';
import {NavigationExtras} from '@angular/router';

@Component({
  templateUrl: './create-project-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectModalComponent implements OnInit {
  @Input()
  public organizationId: string;

  @Input()
  public templateCode: string;

  @Input()
  public navigationExtras: NavigationExtras;

  @ViewChild(CreateProjectTemplatesComponent)
  public templatesComponent: CreateProjectTemplatesComponent;

  public onClose$ = new Subject();

  public templates$: Observable<Project[]>;
  public templatesState$: Observable<LoadingState>;

  public performingAction$ = new BehaviorSubject(false);

  public form = this.fb.group({
    templateSelected: [false, Validators.requiredTrue],
  });
  public formDisabled$ = this.form.statusChanges.pipe(
    startWith(this.form.invalid),
    map(() => this.form.invalid)
  );

  private usedCodes: string[];
  private subscription = new Subscription();

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>, private fb: FormBuilder) {}

  public ngOnInit() {
    this.templates$ = this.store$.pipe(select(selectProjectTemplates));
    this.templatesState$ = this.store$.pipe(select(selectProjectTemplatesLoadingState));

    this.subscription.add(
      this.store$
        .pipe(select(selectProjectsCodesForOrganization(this.organizationId)))
        .subscribe(codes => (this.usedCodes = codes))
    );
  }

  public onSubmit() {
    const template = this.templatesComponent.selectedTemplate$.value;
    const code = this.createCodeForTemplate(template.code);

    this.performingAction$.next(true);

    const colors = Colors.palette;
    const color = colors[Math.round(Math.random() * colors.length)];
    const icon = safeGetRandomIcon();
    const project: Project = {code, name: '', organizationId: this.organizationId, icon, color};

    this.store$.dispatch(
      new ProjectsAction.Create({
        project,
        templateId: template.id,
        navigationExtras: this.navigationExtras,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
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

  private createCodeForTemplate(type: string): string {
    let code = type.substring(0, 5);
    let i = 1;
    const usedCodes = this.usedCodes || [];
    while (usedCodes.includes(code)) {
      code = type.substring(0, 4) + i++;
    }

    return code;
  }
}
