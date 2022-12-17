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

import {of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AppState} from '../../app.state';
import {NotificationsAction} from '../../notifications/notifications.action';
import {ServiceLimitsAction, ServiceLimitsActionType} from './service-limits.action';
import {OrganizationService} from '../../../data-service';
import {convertServiceLimitsDtoToModel} from './service-limits.converter';

@Injectable()
export class ServiceLimitsEffects {
  public getServiceLimits$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ServiceLimitsAction.GetServiceLimits>(ServiceLimitsActionType.GET_SERVICE_LIMITS),
      mergeMap(action => {
        return this.organizationService.getServiceLimits(action.payload.organizationId).pipe(
          map(dto => convertServiceLimitsDtoToModel(action.payload.organizationId, dto)),
          map(serviceLimits => new ServiceLimitsAction.GetServiceLimitsSuccess({serviceLimits: serviceLimits})),
          catchError(error => of(new ServiceLimitsAction.GetServiceLimitsFailure({error})))
        );
      })
    )
  );

  public getServiceLimitsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ServiceLimitsAction.GetServiceLimitsFailure>(ServiceLimitsActionType.GET_SERVICE_LIMITS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.serviceLimits.get.fail:Could not read information about your service level and subscription`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private organizationService: OrganizationService
  ) {}
}
