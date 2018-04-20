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

import {createEntityAdapter, EntityState} from "@ngrx/entity";
import {createSelector} from "@ngrx/store";
import {AppState} from "../../app.state";
import {PaymentModel} from "./payment.model";
import {selectSelectedOrganizationId} from "../organizations.state";

export interface PaymentsState extends EntityState<PaymentModel> {
}

export const paymentsAdapter = createEntityAdapter<PaymentModel>({selectId: payment => payment.id});

export const initialPaymentsState: PaymentsState = paymentsAdapter.getInitialState({
});

export const selectPaymentsState = (state: AppState) => state.payments;
export const selectAllPayments = createSelector(selectPaymentsState, paymentsAdapter.getSelectors().selectAll);
export const selectPaymentsByOrganizationId = (organizationId) => createSelector(selectAllPayments, payments => {
  return payments.filter(payment => payment.organizationId === organizationId);
});
export const selectPaymentsByOrganizationIdSorted = (organizationId) => createSelector(selectPaymentsByOrganizationId(organizationId), payments => {
  return payments.sort((a, b) => b.validUntil.getTime() - a.validUntil.getTime())
});
//export const sllkl = createSelector(selectSelectedOrganizationId, (organizationId) => selectPaymentsByOrganizationId(organizationId));
export const selectPaymentsForSelectedOrganization = createSelector(selectAllPayments, selectSelectedOrganizationId, (payments, organizationId) => {
  return payments.filter(payment => payment.organizationId === organizationId).sort((a, b) => b.validUntil.getTime() - a.validUntil.getTime());
});
