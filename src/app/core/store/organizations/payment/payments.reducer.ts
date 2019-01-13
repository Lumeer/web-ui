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

import {PaymentsAction, PaymentsActionType} from './payments.action';
import {initialPaymentsState, paymentsAdapter, PaymentsState} from './payments.state';
import {Payment} from './payment';

export function paymentsReducer(
  state: PaymentsState = initialPaymentsState,
  action: PaymentsAction.All
): PaymentsState {
  switch (action.type) {
    case PaymentsActionType.GET_PAYMENT_SUCCESS:
      return addOrUpdatePayment(state, action.payload.payment);
    case PaymentsActionType.GET_PAYMENTS_SUCCESS:
      return addPayments(state, action.payload.payments);
    case PaymentsActionType.CREATE_PAYMENT_SUCCESS:
      return addOrUpdatePayment(state, action.payload.payment, true);
    default:
      return state;
  }
}

function addOrUpdatePayment(state: PaymentsState, payment: Payment, updateLastCreated?: boolean): PaymentsState {
  const oldPayment = state.entities[payment.id];
  if (!oldPayment) {
    const newState = updateLastCreated ? {...state, lastCreatedPayment: payment} : state;
    return paymentsAdapter.addOne(payment, newState);
  }

  if (isPaymentNewer(payment, oldPayment)) {
    const newState = updateLastCreated ? {...state, lastCreatedPayment: payment} : state;
    return paymentsAdapter.upsertOne(payment, newState);
  }
  return state;
}

function isPaymentNewer(payment: Payment, oldPayment: Payment): boolean {
  return payment.version && (!oldPayment.version || payment.version > oldPayment.version);
}

function addPayments(state: PaymentsState, payments: Payment[]): PaymentsState {
  const filteredPayments = payments.filter(payment => {
    const oldPayment = state.entities[payment.id];
    return !oldPayment || isPaymentNewer(payment, oldPayment);
  });

  return paymentsAdapter.addMany(filteredPayments, state);
}
