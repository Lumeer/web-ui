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

import {EMPTY, Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {RouteFinder} from '../../../shared/utils/route-finder';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {RouterAction} from '../router/router.action';
import {OrganizationConverter} from './organization.converter';
import {OrganizationsAction, OrganizationsActionType} from './organizations.action';
import {selectOrganizationCodes, selectOrganizationsDictionary, selectOrganizationsLoaded} from './organizations.state';
import {OrganizationDto, PermissionDto} from '../../dto';
import {PermissionType} from '../permissions/permissions';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {CommonAction} from '../common/common.action';
import {ServiceLimitsAction} from './service-limits/service-limits.action';
import {isNullOrUndefined} from '../../../shared/utils/common.utils';
import {selectNavigation} from '../navigation/navigation.state';
import {OrganizationService} from '../../data-service';
import {ModalService} from '../../../shared/modal/modal.service';
import {ChooseOrganizationModalComponent} from '../../../shared/modal/choose-organization/choose-organization-modal.component';

@Injectable()
export class OrganizationsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.Get>(OrganizationsActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsLoaded))),
      filter(([, loaded]) => !loaded),
      mergeMap(() =>
        this.organizationService.getOrganizations().pipe(
          map(dtos => dtos.map(dto => OrganizationConverter.fromDto(dto))),
          map(organizations => new OrganizationsAction.GetSuccess({organizations: organizations})),
          catchError(error => of(new OrganizationsAction.GetFailure({error})))
        )
      )
    )
  );

  public getSingle$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.GetSingle>(OrganizationsActionType.GET_SINGLE),
      mergeMap(action =>
        this.organizationService.getOrganization(action.payload.organizationId).pipe(
          map((dto: OrganizationDto) => OrganizationConverter.fromDto(dto)),
          map(organization => new OrganizationsAction.GetSuccess({organizations: [organization]})),
          catchError(error => of(new OrganizationsAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.GetFailure>(OrganizationsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organizations.get.fail:Could not get organizations`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getCodes$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.GetCodes>(OrganizationsActionType.GET_CODES),
      withLatestFrom(this.store$.pipe(select(selectOrganizationCodes))),
      filter(([, codes]) => isNullOrUndefined(codes)),
      mergeMap(() =>
        this.organizationService.getOrganizationsCodes().pipe(
          map(organizationCodes => new OrganizationsAction.GetCodesSuccess({organizationCodes})),
          catchError(error => of(new OrganizationsAction.GetCodesFailure({error})))
        )
      )
    )
  );

  public getCodesFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<OrganizationsAction.GetCodesFailure>(OrganizationsActionType.GET_CODES_FAILURE),
        tap((action: OrganizationsAction.GetCodesFailure) => console.error(action.payload.error))
      ),
    {dispatch: false}
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.Create>(OrganizationsActionType.CREATE),
      mergeMap(action => {
        const {organization, onSuccess, onFailure} = action.payload;
        const organizationDto = OrganizationConverter.toDto(action.payload.organization);

        return this.organizationService.createOrganization(organizationDto).pipe(
          map(dto => OrganizationConverter.fromDto(dto, organization.correlationId)),
          mergeMap(newOrganization => {
            const actions: Action[] = [
              new OrganizationsAction.CreateSuccess({organization: newOrganization}),
              new ServiceLimitsAction.GetServiceLimits({organizationId: newOrganization.id}),
            ];

            if (onSuccess) {
              actions.push(new CommonAction.ExecuteCallback({callback: () => onSuccess(newOrganization)}));
            }

            return actions;
          }),
          catchError(error => {
            const actions: Action[] = [new OrganizationsAction.CreateFailure({error})];
            if (onFailure) {
              actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure()}));
            }
            return of(...actions);
          })
        );
      })
    )
  );

  public createSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.CreateSuccess>(OrganizationsActionType.CREATE_SUCCESS),
      withLatestFrom(this.store$.pipe(select(selectOrganizationCodes))),
      map(([action, codes]) => {
        const newCodes = (codes && [...codes]) || [];
        if (!newCodes.includes(action.payload.organization.code)) {
          newCodes.push(action.payload.organization.code);
        }
        return new OrganizationsAction.GetCodesSuccess({organizationCodes: newCodes});
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.CreateFailure>(OrganizationsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.create.fail:Could not create the organization`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.Update>(OrganizationsActionType.UPDATE),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
      mergeMap(([action, organizationEntities]) => {
        const organizationDto = OrganizationConverter.toDto(action.payload.organization);
        const oldOrganization = organizationEntities[action.payload.organization.id];
        return this.organizationService.updateOrganization(action.payload.organization.id, organizationDto).pipe(
          map(dto => OrganizationConverter.fromDto(dto)),
          map(
            organization =>
              new OrganizationsAction.UpdateSuccess({
                organization: {...organization, id: organization.id},
                oldCode: oldOrganization.code,
              })
          ),
          catchError(error => of(new OrganizationsAction.UpdateFailure({error})))
        );
      })
    )
  );

  public updateSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.UpdateSuccess>(OrganizationsActionType.UPDATE_SUCCESS),
      withLatestFrom(this.store$.pipe(select(selectOrganizationCodes))),
      mergeMap(([action, codes]) => {
        const {organization, oldCode} = action.payload;
        let newCodes = (codes && [...codes]) || [];
        if (oldCode) {
          newCodes = newCodes.map(code => (code === oldCode ? organization.code : code));
        } else {
          newCodes.push(organization.code);
        }

        const actions: Action[] = [new OrganizationsAction.GetCodesSuccess({organizationCodes: newCodes})];

        const paramMap = RouteFinder.getFirstChildRouteWithParams(this.router.routerState.root.snapshot).paramMap;
        const orgCodeInRoute = paramMap.get('organizationCode');
        if (orgCodeInRoute && oldCode && orgCodeInRoute === oldCode && organization.code !== oldCode) {
          const paths = this.router.routerState.snapshot.url.split('/').filter(path => path);
          const index = paths.indexOf(oldCode, 1);
          if (index !== -1) {
            paths[index] = organization.code;
            actions.push(new RouterAction.Go({path: paths}));
          }
        }
        return actions;
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.UpdateFailure>(OrganizationsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.update.fail:Could not update the organization`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.Delete>(OrganizationsActionType.DELETE),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
      mergeMap(([action, organizationEntities]) => {
        const {organizationId} = action.payload;
        const organization = organizationEntities[organizationId];
        return this.organizationService.deleteOrganization(organizationId).pipe(
          map(() => new OrganizationsAction.DeleteSuccess({organizationId, organizationCode: organization.code})),
          catchError(error => of(new OrganizationsAction.DeleteFailure({error})))
        );
      })
    )
  );

  public deleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.DeleteSuccess>(OrganizationsActionType.DELETE_SUCCESS),
      withLatestFrom(this.store$.pipe(select(selectOrganizationCodes))),
      withLatestFrom(this.store$.pipe(select(selectNavigation))),
      mergeMap(([[action, codes], navigation]) => {
        const {organizationCode} = action.payload;
        let newCodes = (codes && [...codes]) || [];
        if (organizationCode) {
          newCodes = newCodes.filter(code => code !== organizationCode);
        }

        const actions: Action[] = [new OrganizationsAction.GetCodesSuccess({organizationCodes: newCodes})];

        if (navigation && navigation.workspace && navigation.workspace.organizationCode === organizationCode) {
          actions.push(new RouterAction.Go({path: ['/']}));
        }

        return actions;
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.DeleteFailure>(OrganizationsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.delete.fail:Could not delete the organization`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public changePermission$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.ChangePermission>(OrganizationsActionType.CHANGE_PERMISSION),
      mergeMap(action => {
        const workspace = action.payload.workspace;
        const dtos = action.payload.permissions.map(permission => PermissionsConverter.toPermissionDto(permission));

        let observable: Observable<PermissionDto>;
        if (action.payload.type === PermissionType.Users) {
          observable = this.organizationService.updateUserPermission(dtos, workspace);
        } else {
          observable = this.organizationService.updateGroupPermission(dtos, workspace);
        }

        return observable.pipe(
          mergeMap(() => EMPTY),
          catchError(error => {
            const payload = {
              organizationId: workspace.organizationId || action.payload.organizationId,
              type: action.payload.type,
              permissions: action.payload.currentPermissions,
              error,
            };
            return of(new OrganizationsAction.ChangePermissionFailure(payload));
          })
        );
      })
    )
  );

  public changePermissionFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.ChangePermissionFailure>(OrganizationsActionType.CHANGE_PERMISSION_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.permission.change.fail:Could not change the organization permissions`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public choose$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<OrganizationsAction.Choose>(OrganizationsActionType.CHOOSE),
        tap((action: OrganizationsAction.Choose) => {
          const modalRef = this.modalService.showStaticDialog(action.payload, ChooseOrganizationModalComponent);
          modalRef.content.onClose$ = action.payload.onClose$;
        })
      ),
    {dispatch: false}
  );

  public offerPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.OfferPayment>(OrganizationsActionType.OFFER_PAYMENT),
      map(action => {
        const title = $localize`:@@serviceLimits.trial:Free Service`;
        const message = $localize`:@@project.create.serviceLimits:You are currently on the Free plan which allows you to have only one project. Do you want to upgrade to Business now?`;
        return new NotificationsAction.Confirm({
          title: action.payload.title || title,
          message: action.payload.message || message,
          action: new RouterAction.Go({
            path: ['/o', action.payload.organizationCode, 'detail'],
            extras: {fragment: 'orderService'},
          }),
          type: 'warning',
          yesFirst: false,
        });
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private modalService: ModalService,
    private organizationService: OrganizationService
  ) {}
}
