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
import {Router} from '@angular/router';

import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {catchError, concatMap, filter, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {RouteFinder} from '../../../shared/utils/route-finder';
import {OrganizationService} from '../../rest';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {RouterAction} from '../router/router.action';
import {OrganizationConverter} from './organization.converter';
import {OrganizationsAction, OrganizationsActionType} from './organizations.action';
import {selectOrganizationCodes, selectOrganizationsDictionary, selectOrganizationsLoaded} from './organizations.state';
import {isNullOrUndefined} from 'util';
import {Permission} from '../../dto';
import {PermissionType} from '../permissions/permissions.model';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {CommonAction} from '../common/common.action';
import {ServiceLimitsAction} from './service-limits/service-limits.action';

@Injectable()
export class OrganizationsEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.Get>(OrganizationsActionType.GET),
    withLatestFrom(this.store$.select(selectOrganizationsLoaded)),
    filter(([action, loaded]) => !loaded),
    mergeMap(() =>
      this.organizationService.getOrganizations().pipe(
        map(dtos => dtos.map(dto => OrganizationConverter.fromDto(dto))),
        map(organizations => new OrganizationsAction.GetSuccess({organizations: organizations})),
        catchError(error => of(new OrganizationsAction.GetFailure({error: error})))
      )
    )
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.GetFailure>(OrganizationsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'organizations.get.fail', value: 'Could not get organizations'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public getCodes$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.GetCodes>(OrganizationsActionType.GET_CODES),
    withLatestFrom(this.store$.select(selectOrganizationCodes)),
    filter(([action, codes]) => isNullOrUndefined(codes)),
    mergeMap(() =>
      this.organizationService.getOrganizationsCodes().pipe(
        map(organizationCodes => new OrganizationsAction.GetCodesSuccess({organizationCodes})),
        catchError(error => of(new OrganizationsAction.GetCodesFailure({error: error})))
      )
    )
  );

  @Effect({dispatch: false})
  public getCodesFailure$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.GetCodesFailure>(OrganizationsActionType.GET_CODES_FAILURE),
    tap((action: OrganizationsAction.GetCodesFailure) => console.error(action.payload.error))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.Create>(OrganizationsActionType.CREATE),
    mergeMap(action => {
      const correlationId = action.payload.organization.correlationId;
      const organizationDto = OrganizationConverter.toDto(action.payload.organization);

      return this.organizationService.createOrganization(organizationDto).pipe(
        map(dto => OrganizationConverter.fromDto(dto, correlationId)),
        withLatestFrom(this.store$.select(selectOrganizationCodes)),
        mergeMap(([organization, organizationCodes]) => {
          const codes = [...organizationCodes, organization.code];
          const actions: Action[] = [
            new OrganizationsAction.CreateSuccess({organization}),
            new OrganizationsAction.GetCodesSuccess({organizationCodes: codes}),
            new ServiceLimitsAction.GetServiceLimits({organizationId: organization.id}),
          ];

          const {callback} = action.payload;
          if (callback) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => callback(organization)}));
          }

          return actions;
        }),
        catchError(error => of(new OrganizationsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.CreateFailure>(OrganizationsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'organization.create.fail', value: 'Could not create the organization'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.Update>(OrganizationsActionType.UPDATE),
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    mergeMap(([action, organizationEntities]) => {
      const organizationDto = OrganizationConverter.toDto(action.payload.organization);
      const oldOrganization = organizationEntities[action.payload.organization.id];
      return this.organizationService.editOrganization(oldOrganization.code, organizationDto).pipe(
        map(dto => OrganizationConverter.fromDto(dto)),
        withLatestFrom(this.store$.select(selectOrganizationCodes)),
        flatMap(([organization, organizationCodes]) => {
          const actions: Action[] = [
            new OrganizationsAction.UpdateSuccess({organization: {...organization, id: organization.id}}),
          ];
          if (organizationCodes) {
            const codes = organizationCodes.map(code => (code === oldOrganization.code ? organization.code : code));
            actions.push(new OrganizationsAction.GetCodesSuccess({organizationCodes: codes}));
          }

          const paramMap = RouteFinder.getFirstChildRouteWithParams(this.router.routerState.root.snapshot).paramMap;
          const orgCodeInRoute = paramMap.get('organizationCode');

          if (orgCodeInRoute && orgCodeInRoute === oldOrganization.code && organization.code !== oldOrganization.code) {
            const paths = this.router.routerState.snapshot.url.split('/').filter(path => path);
            const index = paths.indexOf(oldOrganization.code, 1);
            if (index !== -1) {
              paths[index] = organization.code;
              actions.push(new RouterAction.Go({path: paths}));
            }
          }

          return actions;
        }),
        catchError(error => of(new OrganizationsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.UpdateFailure>(OrganizationsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'organization.update.fail', value: 'Could not update the organization'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.Delete>(OrganizationsActionType.DELETE),
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    mergeMap(([action, organizationEntities]) => {
      const organization = organizationEntities[action.payload.organizationId];
      return this.organizationService.deleteOrganization(organization.code).pipe(
        withLatestFrom(this.store$.select(selectOrganizationCodes)),
        flatMap(([, organizationCodes]) => {
          const codes = organizationCodes.filter(code => code !== organization.code);

          const actions: Action[] = [
            new OrganizationsAction.DeleteSuccess(action.payload),
            new OrganizationsAction.GetCodesSuccess({organizationCodes: codes}),
          ];

          if (action.payload.onSuccess) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => action.payload.onSuccess()}));
          }

          return actions;
        }),
        catchError(error => of(new OrganizationsAction.DeleteFailure({error: error})))
      );
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.DeleteFailure>(OrganizationsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'organization.delete.fail', value: 'Could not delete the organization'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public changePermission$ = this.actions$.pipe(
    ofType<OrganizationsAction.ChangePermission>(OrganizationsActionType.CHANGE_PERMISSION),
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    concatMap(([action, organizations]) => {
      const organization = organizations[action.payload.organizationId];
      const workspace = {organizationCode: organization.code};
      const permissionDto: Permission = PermissionsConverter.toPermissionDto(action.payload.permission);

      let observable;
      if (action.payload.type === PermissionType.Users) {
        observable = this.organizationService.updateUserPermission([permissionDto], workspace);
      } else {
        observable = this.organizationService.updateGroupPermission([permissionDto], workspace);
      }

      return observable.pipe(
        concatMap(() => of()),
        catchError(error => {
          const payload = {
            organizationId: action.payload.organizationId,
            type: action.payload.type,
            permission: action.payload.currentPermission,
            error,
          };
          return of(new OrganizationsAction.ChangePermissionFailure(payload));
        })
      );
    })
  );

  @Effect()
  public changePermissionFailure$: Observable<Action> = this.actions$.pipe(
    ofType<OrganizationsAction.ChangePermissionFailure>(OrganizationsActionType.CHANGE_PERMISSION_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'organization.permission.change.fail',
        value: 'Could not change the organization permissions',
      });
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private organizationService: OrganizationService
  ) {}
}
