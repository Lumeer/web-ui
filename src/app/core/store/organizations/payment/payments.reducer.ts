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
import {initialPaymentsState, paymentsAdapter, PaymentsState, selectAllPayments} from './payments.state';

export function paymentsReducer(
  state: PaymentsState = initialPaymentsState,
  action: PaymentsAction.All
): PaymentsState {
  switch (action.type) {
    case PaymentsActionType.GET_PAYMENT_SUCCESS:
      return paymentsAdapter.upsertOne(action.payload.payment, state);
    case PaymentsActionType.GET_PAYMENTS_SUCCESS:
      return paymentsAdapter.upsertMany(action.payload.payments, state);
    case PaymentsActionType.CREATE_PAYMENT_SUCCESS:
      return paymentsAdapter.upsertOne(action.payload.payment, {...state, lastCreatedPayment: action.payload.payment});
    default:
      return state;
  }
}
