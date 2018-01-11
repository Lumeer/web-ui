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

import {Injectable} from '@angular/core';
import {Actions, Effect} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, map, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {OrganizationService} from '../../rest';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {OrganizationConverter} from './organization.converter';
import {OrganizationsAction, OrganizationsActionType} from './organizations.action';
import {selectOrganizationsDictionary} from './organizations.state';

@Injectable()
export class OrganizationsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType<OrganizationsAction.Get>(OrganizationsActionType.GET).pipe(
    switchMap(() => this.organizationService.getOrganizations().pipe(
      map(dtos => dtos.map(dto => OrganizationConverter.fromDto(dto)))
    )),
    map(organizations => new OrganizationsAction.GetSuccess({organizations: organizations})),
    catchError(error => Observable.of(new OrganizationsAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<OrganizationsAction.GetFailure>(OrganizationsActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to get organizations'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<OrganizationsAction.Create>(OrganizationsActionType.CREATE).pipe(
    switchMap(action => {
      const correlationId = action.payload.organization.correlationId;
      const organizationDto = OrganizationConverter.toDto(action.payload.organization);

      return this.organizationService.createOrganization(organizationDto).pipe(
        map(dto => OrganizationConverter.fromDto(dto, correlationId))
      );
    }),
    map(organization => new OrganizationsAction.CreateSuccess({organization: organization})),
    catchError(error => Observable.of(new OrganizationsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<OrganizationsAction.CreateFailure>(OrganizationsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to create organization'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<OrganizationsAction.Update>(OrganizationsActionType.UPDATE).pipe(
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    switchMap(([action, organizationEntities]) => {
      const organizationDto = OrganizationConverter.toDto(action.payload.organization);
      const oldOrganization = organizationEntities[action.payload.organization.id];
      return this.organizationService.editOrganization(oldOrganization.code, organizationDto).pipe(
        map(dto => ({action, organization:{...OrganizationConverter.fromDto(dto), permissions: oldOrganization.permissions}}))
      );
    }),
    map(({action, organization}) => new OrganizationsAction.UpdateSuccess({
      organization: {...organization, id: action.payload.organization.id}
    })),
    catchError(error => Observable.of(new OrganizationsAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<OrganizationsAction.UpdateFailure>(OrganizationsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update organization'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<OrganizationsAction.Delete>(OrganizationsActionType.DELETE).pipe(
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    switchMap(([action, organizationEntities]) => {
      const organization = organizationEntities[action.payload.organizationId];
      return this.organizationService.deleteOrganization(organization.code).pipe(
        map(() => action)
      );
    }),
    map(action => new OrganizationsAction.DeleteSuccess(action.payload)),
    catchError(error => Observable.of(new OrganizationsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<OrganizationsAction.DeleteFailure>(OrganizationsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to delete organization'}))
  );

  constructor(private store$: Store<AppState>,
              private actions$: Actions,
              private organizationService: OrganizationService) {
  }

}
