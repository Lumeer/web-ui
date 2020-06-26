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
import {ProjectService} from '../../../core/data-service';
import {catchError, map} from 'rxjs/operators';
import {KeyCode} from '../../key-code';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Project} from '../../../core/store/projects/project';
import {ProjectConverter} from '../../../core/store/projects/project.converter';
import {NavigationExtras} from '@angular/router';
import * as Colors from '../../picker/colors';
import {safeGetRandomIcon} from '../../picker/icons';
import {ProjectsAction} from '../../../core/store/projects/projects.action';
import {selectProjectsCodesForOrganization} from '../../../core/store/projects/projects.state';

@Component({
  templateUrl: './copy-project-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyProjectModalComponent implements OnInit, OnDestroy {
  @Input()
  public organization: Organization;

  @Input()
  public organizationId: string;

  @Input()
  public projectId: string;

  @Input()
  public navigationExtras: NavigationExtras;

  private usedCodes: string[];
  private subscriptions = new Subscription();

  public project$: Observable<Project>;

  public performingAction$ = new BehaviorSubject(false);
  public onClose$ = new Subject();

  constructor(
    private projectService: ProjectService,
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.project$ = this.projectService.getProject(this.organizationId, this.projectId).pipe(
      map(dto => ProjectConverter.fromDto(dto, this.organizationId)),
      catchError(() => of(null))
    );

    this.store$.dispatch(new ProjectsAction.GetCodes({organizationId: this.organization.id}));
    this.subscriptions.add(
      this.store$
        .pipe(select(selectProjectsCodesForOrganization(this.organization.id)))
        .subscribe(codes => (this.usedCodes = codes))
    );
  }

  public onSubmit(project: Project) {
    this.performingAction$.next(true);
    this.createProject(project);
  }

  private createProject(copyProject: Project) {
    const colors = Colors.palette;
    const color = colors[Math.round(Math.random() * colors.length)];
    const icon = safeGetRandomIcon();
    const project: Project = {
      code: this.createSafeCode(copyProject?.code),
      name: '',
      organizationId: this.organizationId,
      icon,
      color,
    };

    this.store$.dispatch(
      new ProjectsAction.Create({
        project,
        copyProject,
        navigationExtras: this.navigationExtras,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private createSafeCode(type: string): string {
    let code = type.substring(0, 5);
    let i = 1;
    const usedCodes = this.usedCodes || [];
    while (usedCodes.includes(code)) {
      code = type.substring(0, 4) + i++;
    }

    return code;
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
