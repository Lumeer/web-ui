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

import {Action} from '@ngrx/store';
import {PaymentModel} from './payment.model';

export enum PaymentsActionType {
  GET_PAYMENT = '[Organizations] Get Payment',
  GET_PAYMENT_SUCCESS = '[Organizations] Get Payment :: Success',
  GET_PAYMENT_FAILURE = '[Organizations] Get Payment :: Failure',

  GET_PAYMENTS = '[Organizations] Get Payments',
  GET_PAYMENTS_SUCCESS = '[Organizations] Get Payments :: Success',
  GET_PAYMENTS_FAILURE = '[Organizations] Get Payments :: Failure',

  CREATE_PAYMENT = '[Organizations] Create Payment',
  CREATE_PAYMENT_SUCCESS = '[Organizations] Create Payment :: Success',
  CREATE_PAYMENT_FAILURE = '[Organizations] Create Payment :: Failure',
}

export namespace PaymentsAction {
  export class GetPayment implements Action {
    public readonly type = PaymentsActionType.GET_PAYMENT;

    public constructor(public payload: {organizationId: string; paymentId: string; nextAction?: Action}) {}
  }

  export class GetPaymentSuccess implements Action {
    public readonly type = PaymentsActionType.GET_PAYMENT_SUCCESS;

    public constructor(public payload: {payment: PaymentModel}) {}
  }

  export class GetPaymentFailure implements Action {
    public readonly type = PaymentsActionType.GET_PAYMENT_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class CreatePayment implements Action {
    public readonly type = PaymentsActionType.CREATE_PAYMENT;

    public constructor(public payload: {organizationId: string; payment: PaymentModel; returnUrl?: string}) {}
  }

  export class CreatePaymentSuccess implements Action {
    public readonly type = PaymentsActionType.CREATE_PAYMENT_SUCCESS;

    public constructor(public payload: {payment: PaymentModel}) {}
  }

  export class CreatePaymentFailure implements Action {
    public readonly type = PaymentsActionType.CREATE_PAYMENT_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetPayments implements Action {
    public readonly type = PaymentsActionType.GET_PAYMENTS;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class GetPaymentsSuccess implements Action {
    public readonly type = PaymentsActionType.GET_PAYMENTS_SUCCESS;

    public constructor(public payload: {payments: PaymentModel[]}) {}
  }

  export class GetPaymentsFailure implements Action {
    public readonly type = PaymentsActionType.GET_PAYMENTS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export type All =
    | GetPayment
    | GetPaymentSuccess
    | GetPaymentFailure
    | GetPayments
    | GetPaymentsSuccess
    | GetPaymentsFailure
    | CreatePayment
    | CreatePaymentSuccess
    | CreatePaymentFailure;
}
