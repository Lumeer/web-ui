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
import {catchError, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState} from '../../app.state';
import {OrganizationService} from '../../../rest';
import {NotificationsAction} from '../../notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {PaymentsAction, PaymentsActionType} from './payments.action';
import {PaymentConverter} from './payment.converter';
import {selectOrganizationByWorkspace} from '../organizations.state';
import {PlatformLocation} from '@angular/common';
import {isNullOrUndefined} from 'util';
import {BrowserPlatformLocation} from '@angular/platform-browser/src/browser/location/browser_platform_location';

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
    withLatestFrom(this.store$.select(selectOrganizationByWorkspace)),
    mergeMap(([action, organization]) => {
      const returnUrl = isNullOrUndefined(action.payload.returnUrl)
        ? (this.location as BrowserPlatformLocation).location.href
        : action.payload.returnUrl;
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

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private organizationService: OrganizationService,
    private location: PlatformLocation
  ) {}
}
