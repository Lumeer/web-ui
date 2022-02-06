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

import {Component, ChangeDetectionStrategy, Input, HostListener, OnInit} from '@angular/core';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {BehaviorSubject, Subject} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {NavigationExtras} from '@angular/router';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {CreateProjectService} from '../../../core/service/create-project.service';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {take} from 'rxjs/operators';
import {ModalService} from '../modal.service';

@Component({
  templateUrl: './choose-organization-modal.component.html',
  styleUrls: ['./choose-organization-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseOrganizationModalComponent implements OnInit {
  @Input()
  public organizations: Organization[];

  @Input()
  public copyProject: Project;

  @Input()
  public templateId: string;

  @Input()
  public initialCode: string;

  @Input()
  public navigationExtras: NavigationExtras;

  @Input()
  public previousDialogState: any;

  public onClose$ = new Subject();

  public selectedOrganization$ = new BehaviorSubject<Organization>(null);
  public performingAction$ = new BehaviorSubject(false);

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private modalService: ModalService,
    private createProjectService: CreateProjectService
  ) {}

  public ngOnInit() {
    this.store$.pipe(select(selectCurrentUser), take(1)).subscribe(user => {
      if (user.defaultWorkspace?.organizationId) {
        const defaultOrganization = this.organizations?.find(
          organization => organization.id === user.defaultWorkspace.organizationId
        );
        if (defaultOrganization) {
          this.selectedOrganization$.next(defaultOrganization);
        }
      }
    });
  }

  public onSubmit() {
    this.performingAction$.next(true);
    const organization = this.selectedOrganization$.value;
    if (organization) {
      this.createProjectService.createProjectInOrganization(organization, this.initialCode, {
        templateId: this.templateId,
        copyProject: this.copyProject,
        navigationExtras: this.navigationExtras,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      });
    }
  }

  public onClose() {
    this.hideDialog();

    if (this.copyProject) {
      const bsModalRef = this.modalService.showCopyProjectDialog(
        this.organizations,
        this.previousDialogState?.organizationId,
        this.previousDialogState?.projectId,
        this.navigationExtras
      );
      bsModalRef.content.onClose$ = this.onClose$;
    } else {
      const bsModalRef = this.modalService.showCreateProjectDialog(
        this.organizations[0],
        this.initialCode,
        this.navigationExtras
      );
      bsModalRef.content.onClose$ = this.onClose$;
    }
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.onClose();
    }
  }

  public onSelect(organization: Organization) {
    this.selectedOrganization$.next(organization);
  }
}
