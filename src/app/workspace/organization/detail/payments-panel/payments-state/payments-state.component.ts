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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {selectOrganizationByWorkspace} from '../../../../../core/store/organizations/organizations.state';
import {isNullOrUndefined} from 'util';
import {filter} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../core/store/app.state';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Subscription} from 'rxjs';
import {selectServiceLimitsByWorkspace} from '../../../../../core/store/organizations/service-limits/service-limits.state';
import {ServiceLimits} from '../../../../../core/store/organizations/service-limits/service.limits';
import {ServiceLimitsAction} from '../../../../../core/store/organizations/service-limits/service-limits.action';
import {ServiceLevelType} from '../../../../../core/dto/service-level-type';

@Component({
  selector: 'payments-state',
  templateUrl: './payments-state.component.html',
  styleUrls: ['./payments-state.component.scss'],
})
export class PaymentsStateComponent implements OnInit, OnDestroy {
  private organization: Organization;
  private organizationSubscription: Subscription;

  public serviceLimits: ServiceLimits;
  private serviceLimitsSubscription: Subscription;

  constructor(private router: Router, private store: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeToStore();
    this.requestData();
  }

  private subscribeToStore() {
    this.organizationSubscription = this.store
      .select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => (this.organization = organization));

    this.serviceLimitsSubscription = this.store
      .select(selectServiceLimitsByWorkspace)
      .pipe(filter(serviceLimits => !isNullOrUndefined(serviceLimits)))
      .subscribe(serviceLimits => (this.serviceLimits = serviceLimits));
  }

  private requestData() {
    this.store.dispatch(new ServiceLimitsAction.GetServiceLimits({organizationId: this.organization.id}));
  }

  public ngOnDestroy(): void {
    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe();
    }

    if (this.serviceLimitsSubscription) {
      this.serviceLimitsSubscription.unsubscribe();
    }
  }

  public isFree(): boolean {
    return this.serviceLimits && this.serviceLimits.serviceLevel === ServiceLevelType.FREE;
  }

  public isBasic(): boolean {
    return this.serviceLimits && this.serviceLimits.serviceLevel === ServiceLevelType.BASIC;
  }
}
