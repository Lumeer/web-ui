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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';

import {AppState} from '../../../../../core/store/app.state';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Payment, PaymentState} from '../../../../../core/store/organizations/payment/payment';
import {PaymentsAction} from '../../../../../core/store/organizations/payment/payments.action';
import {selectPaymentsByWorkspaceSorted} from '../../../../../core/store/organizations/payment/payments.state';
import {ServiceLimitsAction} from '../../../../../core/store/organizations/service-limits/service-limits.action';

@Component({
  selector: 'payments-list',
  templateUrl: './payments-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsListComponent implements OnInit {
  @Input()
  public organization: Organization;

  @Output()
  public repay = new EventEmitter<string>();

  public paymentState = PaymentState;

  public payments$: Observable<Payment[]>;

  constructor(
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.payments$ = this.store$.pipe(select(selectPaymentsByWorkspaceSorted));
  }

  public refreshPayment(paymentId: string) {
    this.store$.dispatch(
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
    this.store$.dispatch(
      new NotificationsAction.Info({
        title: $localize`:@@organization.payments.addUsers.title:Add Users`,
        message: $localize`:@@organization.payments.addUsers.info:To add more users to your organization, please contact support@lumeer.io.`,
      })
    );
  }

  public trackByPayment(index: number, payment: Payment): string {
    return payment.id;
  }
}
