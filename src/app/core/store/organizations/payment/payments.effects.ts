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

import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError, flatMap, map, mergeMap, tap} from 'rxjs/operators';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState} from '../../app.state';
import {OrganizationService} from '../../../rest';
import {NotificationsAction} from '../../notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {PaymentsAction, PaymentsActionType} from './payments.action';
import {PaymentConverter} from './payment.converter';
import {PlatformLocation} from '@angular/common';
import {BrowserPlatformLocation} from '@angular/platform-browser/src/browser/location/browser_platform_location';
import {Angulartics2} from 'angulartics2';

@Injectable()
export class PaymentsEffects {
  @Effect()
  public getPayments$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.GetPayments>(PaymentsActionType.GET_PAYMENTS),
    mergeMap(action => {
      return this.organizationService.getPayments().pipe(
        map(dtos => dtos.map(dto => PaymentConverter.fromDto(action.payload.organizationId, dto))),
        map(payments => new PaymentsAction.GetPaymentsSuccess({payments: payments})),
        catchError(error => of(new PaymentsAction.GetPaymentsFailure({error: error})))
      );
    })
  );

  @Effect()
  public getPaymentsFailure$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.GetPaymentsFailure>(PaymentsActionType.GET_PAYMENTS_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'organization.payments.get.fail',
        value: 'Could not read information about your previous service orders',
      });
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public getPaymentSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.GetPaymentSuccess>(PaymentsActionType.GET_PAYMENT_SUCCESS),
    mergeMap(action => {
      if (action.payload.payment.state === 'PAID') {
        this.angulartics2.eventTrack.next({
          action: 'Payment paid',
          properties: {
            category: 'Payments',
            label: action.payload.payment.currency,
            value: action.payload.payment.state,
          },
        });
      }
      return of(null);
    })
  );

  @Effect()
  public getPayment$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.GetPayment>(PaymentsActionType.GET_PAYMENT),
    mergeMap(action => {
      return this.organizationService.getPayment(action.payload.paymentId).pipe(
        map(dto => PaymentConverter.fromDto(action.payload.organizationId, dto)),
        map(payment => ({payment, nextAction: action.payload.nextAction})),
        flatMap(({payment, nextAction}) => {
          const actions: Action[] = [new PaymentsAction.GetPaymentSuccess({payment: payment})];
          if (nextAction) {
            actions.push(nextAction);
          }
          return actions;
        }),
        catchError(error => of(new PaymentsAction.GetPaymentFailure({error: error})))
      );
    })
  );

  @Effect()
  public getPaymentFailure$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.GetPaymentFailure>(PaymentsActionType.GET_PAYMENT_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'organization.payment.get.fail',
        value: 'Could not read information about your previous service order',
      });
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public createPayment$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.CreatePayment>(PaymentsActionType.CREATE_PAYMENT),
    mergeMap(action => {
      const returnUrl =
        (action.payload.returnUrl && action.payload.returnUrl) ||
        (this.location as BrowserPlatformLocation).location.href;
      return this.organizationService.createPayment(PaymentConverter.toDto(action.payload.payment), returnUrl).pipe(
        map(dto => PaymentConverter.fromDto(action.payload.organizationId, dto)),
        map(payment => new PaymentsAction.CreatePaymentSuccess({payment: payment})),
        catchError(error => of(new PaymentsAction.CreatePaymentFailure({error: error})))
      );
    })
  );

  @Effect()
  public createPaymentFailure$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.CreatePaymentFailure>(PaymentsActionType.CREATE_PAYMENT_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'organization.payment.create.fail',
        value: 'Could not create your new service order',
      });
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public createPaymentSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<PaymentsAction.CreatePaymentSuccess>(PaymentsActionType.CREATE_PAYMENT_SUCCESS),
    mergeMap(action => {
      this.angulartics2.eventTrack.next({
        action: 'Payment create',
        properties: {
          category: 'Payments',
          label: action.payload.payment.currency,
          value: action.payload.payment.amount,
        },
      });
      return of(null);
    })
  );

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private organizationService: OrganizationService,
    private location: PlatformLocation,
    private angulartics2: Angulartics2
  ) {}
}
