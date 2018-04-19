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

import {Injectable} from "@angular/core";
import {catchError, map, mergeMap, tap} from "rxjs/operators";
import {Actions, Effect, ofType} from "@ngrx/effects";
import {Action, Store} from "@ngrx/store";
import {Router} from "@angular/router";
import {AppState} from "../../app.state";
import {OrganizationService} from "../../../rest";
import {NotificationsAction} from "../../notifications/notifications.action";
import {Observable} from "rxjs/Observable";
import {I18n} from "@ngx-translate/i18n-polyfill";
import {ServiceLimitsAction, ServiceLimitsActionType} from "./service-limits.action";

@Injectable()
export class ServiceLimitsEffects {
/*  @Effect()
  public getServiceLimits$: Observable<Action> = this.actions$.pipe(
    ofType<ServiceLimitsAction.GetServiceLimits>(ServiceLimitsActionType.GET_SERVICE_LIMITS),
    mergeMap(action => this.organizationService.getOrganizationContact(action.payload.organizationCode)),
    map(contact => new ContactsAction.GetContactSuccess({ contact: ContactConverter.fromDto(contact) })),
    catchError(error => Observable.of(new ContactsAction.GetContactFailure({error: error})))
  );

  @Effect()
  public getServiceLimitsFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ServiceLimitsAction.GetServiceLimitsFailure>(ServiceLimitsActionType.GET_SERVICE_LIMITS_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'organization.contact.get.fail', value: 'Cannot read contact information'});
      return new NotificationsAction.Error({message});
    })
  );
*/
  constructor(private i18n: I18n,
              private store$: Store<AppState>,
              private router: Router,
              private actions$: Actions,
              private organizationService: OrganizationService) {
  }
}
