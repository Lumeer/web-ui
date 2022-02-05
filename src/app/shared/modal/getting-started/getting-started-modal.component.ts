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

import {Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {NavigationExtras} from '@angular/router';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AppState} from '../../../core/store/app.state';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {CreateProjectService} from '../../../core/service/create-project.service';
import {OrganizationsAction} from '../../../core/store/organizations/organizations.action';
import {GettingStartedService, GettingStartedStage} from './getting-started.service';
import {Subscription} from 'rxjs';

@Component({
  templateUrl: './getting-started-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GettingStartedService],
})
export class GettingStartedModalComponent implements OnInit, OnDestroy {
  @Input()
  public organizations: Organization[];

  @Input()
  public templateCode: string;

  @Input()
  public navigationExtras: NavigationExtras;

  public readonly stage = GettingStartedStage;

  private subscriptions = new Subscription();

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private fb: FormBuilder,
    public service: GettingStartedService,
    private createProjectService: CreateProjectService
  ) {}

  public ngOnInit() {
    this.subscribeClose();
    this.subscribeStage();
  }

  private subscribeClose() {
    this.subscriptions.add(this.service.close$.subscribe(() => this.hideDialog()));
  }

  private subscribeStage() {
    this.subscriptions.add(
      this.service.stage$.subscribe(stage => {
        switch (stage) {
          case GettingStartedStage.Template:
            this.bsModalRef.setClass('modal-xxl modal-h-100');
            break;
          default:
            this.bsModalRef.setClass('modal-lg');
        }
      })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    this.service.onSubmit();
    // const template = this.templatesComponent.selectedTemplate$.value;
    // if (this.organizations.length === 1) {
    //   this.performingAction$.next(true);
    //   this.createProject(template);
    // } else {
    //   this.chooseOrganization(template);
    // }
  }

  public onSecondarySubmit() {
    this.service.onSecondarySubmit();
    // if (this.organizations.length === 1) {
    //   this.performingSecondaryAction$.next(true);
    //   this.createProject();
    // } else {
    //   this.chooseOrganization();
    // }
  }

  private onFailure() {}

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
        onClose$: null,
        navigationExtras: this.navigationExtras,
      })
    );
  }

  public onClose() {
    this.service.onClose();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }
}
