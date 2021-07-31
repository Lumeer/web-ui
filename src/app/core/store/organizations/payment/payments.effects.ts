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

import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Angulartics2} from 'angulartics2';
import {of} from 'rxjs';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {NotificationsAction} from '../../notifications/notifications.action';
import {PaymentConverter} from './payment.converter';
import {PaymentsAction, PaymentsActionType} from './payments.action';
import mixpanel from 'mixpanel-browser';
import {Payment} from './payment';
import {OrganizationService} from '../../../data-service';
import {ConfigurationService} from '../../../../configuration/configuration.service';

@Injectable()
export class PaymentsEffects {
  public getPayments$ = createEffect(() =>
    this.actions$.pipe(
      ofType<PaymentsAction.GetPayments>(PaymentsActionType.GET_PAYMENTS),
      mergeMap(action => {
        return this.organizationService.getPayments().pipe(
          map(dtos => dtos.map(dto => PaymentConverter.fromDto(action.payload.organizationId, dto))),
          map(payments => new PaymentsAction.GetPaymentsSuccess({payments: payments})),
          catchError(error => of(new PaymentsAction.GetPaymentsFailure({error})))
        );
      })
    )
  );

  public getPaymentsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<PaymentsAction.GetPaymentsFailure>(PaymentsActionType.GET_PAYMENTS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.payments.get.fail:Could not read information about your previous service orders`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getPaymentSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PaymentsAction.GetPaymentSuccess>(PaymentsActionType.GET_PAYMENT_SUCCESS),
        tap((action: PaymentsAction.GetPaymentSuccess) => {
          if (this.configurationService.getConfiguration().analytics && action.payload.payment.state === 'PAID') {
            this.angulartics2.eventTrack.next({
              action: 'Payment paid',
              properties: {
                category: 'Payments',
                label: action.payload.payment.currency,
                value: action.payload.payment.state,
              },
            });

            const price = this.getPrice(action.payload.payment);
            const ga = (window as any).ga;
            if (ga) {
              ga('ecommerce:addTransaction', {
                id: action.payload.payment.paymentId,
                affiliation: 'plans',
                revenue: price,
                shipping: '0',
                tax: price * 0.15,
              });
              ga('ecommerce:send');
            }

            if (this.configurationService.getConfiguration().mixpanelKey) {
              mixpanel.track('Payment Paid', {
                CZK: price,
                users: action.payload.payment.users,
                validUntil: action.payload.payment.validUntil,
              });
            }
          }
        })
      ),
    {dispatch: false}
  );

  public getPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType<PaymentsAction.GetPayment>(PaymentsActionType.GET_PAYMENT),
      mergeMap(action => {
        return this.organizationService.getPayment(action.payload.paymentId).pipe(
          map(dto => PaymentConverter.fromDto(action.payload.organizationId, dto)),
          map(payment => ({payment, nextAction: action.payload.nextAction})),
          mergeMap(({payment, nextAction}) => {
            const actions: Action[] = [new PaymentsAction.GetPaymentSuccess({payment: payment})];
            if (nextAction) {
              actions.push(nextAction);
            }
            return actions;
          }),
          catchError(error => of(new PaymentsAction.GetPaymentFailure({error})))
        );
      })
    )
  );

  public getPaymentFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<PaymentsAction.GetPaymentFailure>(PaymentsActionType.GET_PAYMENT_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.payment.get.fail:Could not read information about your previous service order`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public createPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType<PaymentsAction.CreatePayment>(PaymentsActionType.CREATE_PAYMENT),
      mergeMap(action => {
        const returnUrl = action.payload.returnUrl || window.location.href;
        return this.organizationService.createPayment(PaymentConverter.toDto(action.payload.payment), returnUrl).pipe(
          map(dto => PaymentConverter.fromDto(action.payload.organizationId, dto)),
          map(payment => new PaymentsAction.CreatePaymentSuccess({payment: payment})),
          catchError(error => of(new PaymentsAction.CreatePaymentFailure({error})))
        );
      })
    )
  );

  public createPaymentFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<PaymentsAction.CreatePaymentFailure>(PaymentsActionType.CREATE_PAYMENT_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.payment.create.fail:Could not create your new service order`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public createPaymentSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PaymentsAction.CreatePaymentSuccess>(PaymentsActionType.CREATE_PAYMENT_SUCCESS),
        tap((action: PaymentsAction.CreatePaymentSuccess) => {
          if (this.configurationService.getConfiguration().analytics) {
            this.angulartics2.eventTrack.next({
              action: 'Payment create',
              properties: {
                category: 'Payments',
                label: action.payload.payment.currency,
                value: action.payload.payment.amount,
              },
            });

            if (this.configurationService.getConfiguration().mixpanelKey) {
              const price = this.getPrice(action.payload.payment);
              mixpanel.track('Payment Create', {
                CZK: price,
                users: action.payload.payment.users,
              });
            }
          }
        })
      ),
    {dispatch: false}
  );

  private getPrice(payment: Payment): number {
    let price = payment.amount;
    if (payment.currency === 'EUR') {
      price = price * 26.1;
    } else if (payment.currency === 'USD') {
      price = price * 22.84;
    }

    return price;
  }

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private organizationService: OrganizationService,
    private angulartics2: Angulartics2,
    private configurationService: ConfigurationService
  ) {}
}
