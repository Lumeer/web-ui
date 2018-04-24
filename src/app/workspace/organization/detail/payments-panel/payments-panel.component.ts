/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {PaymentModel} from "../../../../core/store/organizations/payment/payment.model";
import {OrganizationModel} from "../../../../core/store/organizations/organization.model";
import {Subscription} from "rxjs/Subscription";
import {ActionsSubject, Store} from "@ngrx/store";
import {Router} from "@angular/router";
import {I18n} from "@ngx-translate/i18n-polyfill";
import {AppState} from "../../../../core/store/app.state";
import {isNullOrUndefined} from "util";
import {filter} from "rxjs/operators";
import {selectOrganizationByWorkspace} from "../../../../core/store/organizations/organizations.state";
import {PaymentsAction, PaymentsActionType} from "../../../../core/store/organizations/payment/payments.action";
import {ServiceLimitsModel} from "../../../../core/store/organizations/service-limits/service-limits.model";
import {selectServiceLimitsByWorkspace} from "../../../../core/store/organizations/service-limits/service-limits.state";
import {selectLastCreatedPayment} from "../../../../core/store/organizations/payment/payments.state";

@Component({
  selector: 'payments-panel',
  templateUrl: './payments-panel.component.html',
  styleUrls: ['./payments-panel.component.scss']
})
export class PaymentsPanelComponent implements OnInit, OnDestroy {

  private organization: OrganizationModel;
  private organizationSubscription: Subscription;

  private serviceLimits: ServiceLimitsModel;
  private serviceLimitsSubscription: Subscription;

  private readonly languageCode: string = 'en';

  public lastPayment: PaymentModel;
  private paymentCreatedSubscription: Subscription;
  private lastCreatedPayment: Subscription;

  constructor(private i18n: I18n,
              private router: Router,
              private store: Store<AppState>,
              private actionsSubject: ActionsSubject) {
    this.languageCode = this.i18n({ id: 'organization.payments.lang.code', value: 'en' });
  }

  public ngOnInit() {
    this.subscribeToStore();
    this.subscribeToActions();
  }

  public subscribeToStore() {
    this.organizationSubscription = this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => this.organization = organization);

    this.serviceLimitsSubscription = this.store.select(selectServiceLimitsByWorkspace)
      .pipe(filter(serviceLimits => !isNullOrUndefined(serviceLimits)))
      .subscribe(serviceLimits => this.serviceLimits = serviceLimits);

    this.lastCreatedPayment = this.store.select(selectLastCreatedPayment)
      .pipe(filter(payment => !isNullOrUndefined(payment)))
      .subscribe(payment => this.lastPayment = payment);
  }

  public ngOnDestroy(): void {
    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe();
    }

    if (this.serviceLimitsSubscription) {
      this.serviceLimitsSubscription.unsubscribe();
    }

    if (this.paymentCreatedSubscription) {
      this.paymentCreatedSubscription.unsubscribe();
    }

    if (this.lastCreatedPayment) {
      this.lastCreatedPayment.unsubscribe();
    }
  }

  public createPayment($event) {
    let validUntil: Date;

    validUntil = new Date($event.start.getFullYear(), $event.start.getMonth() + $event.months, $event.start.getDate(), 23, 59, 59, 999);

    let payment: PaymentModel = { date: new Date(), serviceLevel: 'BASIC', amount: $event.amount, currency: $event.currency,
      start: $event.start, validUntil, state: 'CREATED', users: $event.users, language: this.languageCode, gwUrl: '',
      paymentId: null, id: null, organizationId: this.organization.id };
    this.store.dispatch(new PaymentsAction.CreatePayment({ organizationId: this.organization.id, payment }));
  }

  private subscribeToActions() {
    this.paymentCreatedSubscription = this.actionsSubject.subscribe(data => {
      if (data.type === PaymentsActionType.CREATE_PAYMENT_SUCCESS) {
        console.log("pajoment created");
        console.log(this.lastPayment);
      }
    });
  }


}
