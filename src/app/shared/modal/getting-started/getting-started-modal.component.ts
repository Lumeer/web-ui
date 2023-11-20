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
import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NavigationExtras} from '@angular/router';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {Observable, Subscription, combineLatest} from 'rxjs';
import {map} from 'rxjs/operators';

import {PublicProjectService} from '../../../core/data-service/project/public-project.service';
import {Organization} from '../../../core/store/organizations/organization';
import {animateOpacityEnterLeave} from '../../animations';
import {ModalProgress} from '../wrapper/model/modal-progress';
import {GettingStartedService} from './getting-started.service';
import {GettingStartedModalType} from './model/getting-started-modal-type';
import {GettingStartedStage} from './model/getting-started-stage';

@Component({
  selector: 'getting-started-modal',
  templateUrl: './getting-started-modal.component.html',
  styleUrls: ['./getting-started-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PublicProjectService, GettingStartedService],
  animations: [animateOpacityEnterLeave],
})
export class GettingStartedModalComponent implements OnInit, OnDestroy {
  @Input()
  public type: GettingStartedModalType = GettingStartedModalType.Template;

  @Input()
  public writableOrganizations: Organization[];

  @Input()
  public selectedOrganization: Organization;

  @Input()
  public templateCode: string;

  @Input()
  public copyOrganizationId: string;

  @Input()
  public copyProjectId: string;

  @Input()
  public navigationExtras: NavigationExtras;

  public readonly stage = GettingStartedStage;

  public progress$: Observable<ModalProgress>;

  private subscriptions = new Subscription();

  constructor(
    private bsModalRef: BsModalRef,
    public service: GettingStartedService
  ) {}

  public ngOnInit() {
    this.service.setNavigationExtras(this.navigationExtras);
    this.service.setWritableOrganizations(this.writableOrganizations);
    this.service.selectedOrganization = this.selectedOrganization;

    switch (this.type) {
      case GettingStartedModalType.Template:
        this.service.setInitialStage(GettingStartedStage.Template);
        break;
      case GettingStartedModalType.CopyProject:
        this.service.setCopyData(this.copyOrganizationId, this.copyProjectId);
        this.service.setInitialStage(GettingStartedStage.CopyProject);
        break;
      case GettingStartedModalType.EmailVerification:
        this.service.setInitialStage(GettingStartedStage.EmailVerification);
        break;
      case GettingStartedModalType.Video:
        this.service.setInitialStage(GettingStartedStage.Video);
        break;
    }

    this.progress$ = combineLatest([this.service.stage$, this.service.stages$]).pipe(
      map(([stage, stages]) => {
        if (stages.length < 2) {
          return null;
        }
        const stageIndex = stages.findIndex(s => s === stage);
        return {value: stageIndex + 1, max: stages.length};
      })
    );

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
          case GettingStartedStage.EmailVerification:
            this.bsModalRef.setClass('');
            break;
          case GettingStartedStage.Video:
            this.bsModalRef.setClass('modal-xl');
            break;
          default:
            this.bsModalRef.setClass('modal-lg');
            break;
        }
      })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.service.onDestroy();
  }

  public onSubmit() {
    this.service.onSubmit();
  }

  public onSecondarySubmit() {
    this.service.onSecondarySubmit();
  }

  public onClose() {
    this.service.onClose();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }
}
