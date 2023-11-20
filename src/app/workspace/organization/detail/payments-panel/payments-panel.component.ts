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

import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Inject, Input} from '@angular/core';
import {DatePipe, DOCUMENT} from '@angular/common';
import {Payment} from '../../../../core/store/organizations/payment/payment';
import {Organization} from '../../../../core/store/organizations/organization';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {PaymentsAction} from '../../../../core/store/organizations/payment/payments.action';
import {ServiceLimits} from '../../../../core/store/organizations/service-limits/service.limits';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import {ServiceLevelType} from '../../../../core/dto/service-level-type';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {ConfigurationService} from '../../../../configuration/configuration.service';
import {isNotNullOrUndefined} from '@lumeer/utils';

@Component({
  selector: 'payments-panel',
  templateUrl: './payments-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsPanelComponent implements AfterViewInit {
  @Input()
  public organization: Organization;

  @Input()
  public serviceLimits: ServiceLimits;

  @Input()
  public lastPayment: Payment;

  private readonly languageCode: string;

  constructor(
    private store$: Store<AppState>,
    @Inject(DOCUMENT) private document,
    private elementRef: ElementRef,
    private notificationService: NotificationService,
    private datePipe: DatePipe,
    private configurationService: ConfigurationService
  ) {
    this.languageCode = $localize`:@@organization.payments.lang.code:en`;
  }

  public createPayment($event) {
    const validUntil: Date = new Date(
      $event.start.getFullYear(),
      +$event.start.getMonth() + +$event.months,
      $event.start.getDate(),
      23,
      59,
      59,
      999
    );

    const payment: Payment = {
      date: new Date(),
      serviceLevel: 'BASIC',
      amount: $event.amount,
      currency: $event.currency,
      start: $event.start,
      validUntil,
      state: 'CREATED',
      users: $event.users,
      language: this.languageCode,
      gwUrl: '',
      paymentId: null,
      id: null,
      organizationId: this.organization.id,
    };

    if (
      this.serviceLimits.serviceLevel !== ServiceLevelType.FREE &&
      this.checkDayOverlap(this.serviceLimits.validUntil, $event.start)
    ) {
      const validUntil = this.datePipe.transform(this.serviceLimits.validUntil, 'shortDate');
      const start = this.datePipe.transform($event.start, 'shortDate');
      this.store$.dispatch(
        new NotificationsAction.Confirm({
          title: $localize`:@@organization.payments.paidWarning.title:Already Paid`,
          message: $localize`:@@organization.payments.paidWarning.text:Your current subscription lasts until ${validUntil}:validUntil:. Are you sure you want to proceed with an order with earlier start date of ${start}:start:? In case you want to add more users, please contact support@lumeer.io.`,
          action: new PaymentsAction.CreatePayment({
            organizationId: this.organization.id,
            payment,
            onSuccess: payment => this.onPaymentCreated(payment),
          }),
          type: 'warning',
        })
      );
    } else {
      this.store$.dispatch(
        new PaymentsAction.CreatePayment({
          organizationId: this.organization.id,
          payment,
          onSuccess: payment => this.onPaymentCreated(payment),
        })
      );
    }
  }

  private onPaymentCreated(payment: Payment) {
    this.callGoPay(payment.gwUrl);
  }

  private checkDayOverlap(serviceUntil: Date, newOrder: Date): boolean {
    const serviceDay = new Date(
      serviceUntil.getFullYear(),
      serviceUntil.getMonth(),
      serviceUntil.getDate(),
      23,
      59,
      59,
      999
    );
    const newOrderDay = new Date(newOrder.getFullYear(), newOrder.getMonth(), newOrder.getDate(), 0, 0, 0, 0);
    return serviceDay.getTime() > newOrderDay.getTime();
  }

  public callGoPay($event: string) {
    /*
    const message = $localize`:@@organization.payments.disabled.message:Thank you for your interest. Payments not available. We'll get in touch with you soon!`;
    const title = $localize`:@@organization.payments.disabled.title:Thank You!`;
    const okButtonText = $localize`:@@button.ok:OK`;

    this.notificationService.confirm(message, title, [
      {text: okButtonText, bold: true},
    ]);
    */

    if (isNotNullOrUndefined($event) && $event !== '') {
      (window as any)._gopay.checkout({gatewayUrl: $event, inline: true});
    }
  }

  public ngAfterViewInit() {
    const script = this.document.createElement('script');
    script.type = 'text/javascript';
    script.src = this.configurationService.getConfiguration().paymentGw;
    this.elementRef.nativeElement.appendChild(script);
  }
}
