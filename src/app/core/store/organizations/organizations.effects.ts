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
import {Action} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {OrganizationService} from '../../rest';
import {NotificationsAction} from '../notifications/notifications.action';
import {OrganizationConverter} from './organization.converter';
import {OrganizationModel} from './organization.model';
import {OrganizationsAction, OrganizationsActionType} from './organizations.action';

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
    map(action => new NotificationsAction.Error({message: 'Failed to get organizations'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<OrganizationsAction.Create>(OrganizationsActionType.CREATE).pipe(
    switchMap(action => {
      const organizationDto = OrganizationConverter.toDto(action.payload.organization);

      return this.organizationService.createOrganization(organizationDto).pipe(
        map(dto => OrganizationConverter.fromDto(dto))
      );
    }),
    map(organization => new OrganizationsAction.CreateSuccess({organization: organization})),
    catchError(error => Observable.of(new OrganizationsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<OrganizationsAction.CreateFailure>(OrganizationsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to create organization'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<OrganizationsAction.Update>(OrganizationsActionType.UPDATE).pipe(
    switchMap(action => {
      const organizationDto = OrganizationConverter.toDto(action.payload.organization);

      return this.organizationService.editOrganization(organizationDto.code, organizationDto).pipe(
        map(dto => [action, OrganizationConverter.fromDto(dto)])
      );
    }),
    map(([action, organization]: [OrganizationsAction.Update, OrganizationModel]) =>
      new OrganizationsAction.UpdateSuccess({organizationCode: action.payload.organizationCode, organization: organization})),
    catchError(error => Observable.of(new OrganizationsAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<OrganizationsAction.UpdateFailure>(OrganizationsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to update organization'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<OrganizationsAction.Delete>(OrganizationsActionType.DELETE).pipe(
    switchMap(action => this.organizationService.deleteOrganization(action.payload.organizationCode).pipe(
      map(() => action)
    )),
    map(action => new OrganizationsAction.DeleteSuccess(action.payload)),
    catchError(error => Observable.of(new OrganizationsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<OrganizationsAction.DeleteFailure>(OrganizationsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to delete organization'}))
  );

  constructor(private actions$: Actions,
              private organizationService: OrganizationService) {
  }

}
