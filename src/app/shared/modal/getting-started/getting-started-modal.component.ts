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
import {NavigationExtras} from '@angular/router';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Subscription} from 'rxjs';
import {Organization} from '../../../core/store/organizations/organization';
import {GettingStartedService, GettingStartedStage} from './getting-started.service';

@Component({
  templateUrl: './getting-started-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GettingStartedService],
})
export class GettingStartedModalComponent implements OnInit, OnDestroy {
  @Input()
  public organization: Organization;

  @Input()
  public templateCode: string;

  @Input()
  public navigationExtras: NavigationExtras;

  public readonly stage = GettingStartedStage;

  private subscriptions = new Subscription();

  constructor(private bsModalRef: BsModalRef, public service: GettingStartedService) {}

  public ngOnInit() {
    this.service.setNavigationExtras(this.navigationExtras);
    this.service.selectedOrganization = this.organization;

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
