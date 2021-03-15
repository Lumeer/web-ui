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

import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState} from '../../../../../core/store/app.state';
import {selectOrganizationByWorkspace} from '../../../../../core/store/organizations/organizations.state';
import {isNullOrUndefined} from 'util';
import {filter} from 'rxjs/operators';
import {Payment} from '../../../../../core/store/organizations/payment/payment';
import {selectPaymentsByWorkspaceSorted} from '../../../../../core/store/organizations/payment/payments.state';
import {PaymentsAction} from '../../../../../core/store/organizations/payment/payments.action';
import {ServiceLimitsAction} from '../../../../../core/store/organizations/service-limits/service-limits.action';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';

@Component({
  selector: 'payments-list',
  templateUrl: './payments-list.component.html',
  styleUrls: ['./payments-list.component.scss'],
})
export class PaymentsListComponent implements OnInit, OnDestroy {
  @Output()
  public repay = new EventEmitter<string>();

  private organization: Organization;
  private organizationSubscription: Subscription;

  public payments: Payment[];
  private paymentsSubscription: Subscription;

  constructor(private router: Router, private store: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeToStore();
    this.requestData();
  }

  public subscribeToStore() {
    this.organizationSubscription = this.store
      .select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => (this.organization = organization));

    this.paymentsSubscription = this.store
      .select(selectPaymentsByWorkspaceSorted)
      .pipe(filter(payments => !isNullOrUndefined(payments) && payments.length > 0))
      .subscribe(payments => (this.payments = payments));
  }

  public requestData() {
    this.store.dispatch(new PaymentsAction.GetPayments({organizationId: this.organization.id}));
  }

  public ngOnDestroy(): void {
    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe();
    }

    if (this.paymentsSubscription) {
      this.paymentsSubscription.unsubscribe();
    }
  }

  public refreshPayment(paymentId: string) {
    this.store.dispatch(
      new PaymentsAction.GetPayment({
        organizationId: this.organization.id,
        paymentId,
        nextAction: new ServiceLimitsAction.GetServiceLimits({organizationId: this.organization.id}),
      })
    );
  }

  public repayEvent(gwUrl: string) {
    this.repay.emit(gwUrl);
  }

  public addUsers() {
    this.store.dispatch(
      new NotificationsAction.Info({
        title: $localize`:@@organization.payments.addUsers.title:Add Users`,
        message: $localize`:@@organization.payments.addUsers.info:To add more users to your organization, please contact support@lumeer.io.`,
      })
    );
  }
}
